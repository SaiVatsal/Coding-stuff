// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "Internet/GameInternetSubsystem.h"
#include "HttpModule.h"
#include "JsonObjectConverter.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Async/Async.h"
#include "Misc/DateTime.h"

void UGameInternetSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    LastRefillTime = FPlatformTime::Seconds();
    UE_LOG(LogTemp, Log, TEXT("[Eyefind] UGameInternetSubsystem Initialized. Gateway at %s"), *GatewayBaseURL);
}

void UGameInternetSubsystem::Deinitialize()
{
    FScopeLock Lock(&CacheLock);
    SearchCache.Empty();
    CacheAccessOrder.Empty();
    Super::Deinitialize();
}

void UGameInternetSubsystem::SetGatewayEndpoint(const FString& InEndpoint)
{
    GatewayBaseURL = InEndpoint;
}

void UGameInternetSubsystem::FlushCache()
{
    FScopeLock Lock(&CacheLock);
    SearchCache.Empty();
    CacheAccessOrder.Empty();
    UE_LOG(LogTemp, Log, TEXT("[Eyefind] Search cache flushed."));
}

void UGameInternetSubsystem::RefillRateLimitTokens()
{
    double CurrentTime = FPlatformTime::Seconds();
    double Delta = CurrentTime - LastRefillTime;
    LastRefillTime = CurrentTime;

    TokenBucket = FMath::Min(MaxTokens, TokenBucket + static_cast<float>(Delta * RefillRatePerSecond));
}

bool UGameInternetSubsystem::TryConsumeRateLimitToken()
{
    RefillRateLimitTokens();
    if (TokenBucket >= 1.0f)
    {
        TokenBucket -= 1.0f;
        return true;
    }
    return false;
}

void UGameInternetSubsystem::ExecuteSearchQuery(const FString& QueryString, EEyefindSearchMode SearchMode, EEyefindSearchCategory Category)
{
    const FString TrimmedQuery = QueryString.TrimStartAndEnd();
    if (TrimmedQuery.IsEmpty())
    {
        OnSearchCompleted.Broadcast(false, QueryString, TArray<FEyefindSearchResultItem>());
        return;
    }

    const FString CacheKey = FString::Printf(TEXT("%d_%d_%s"), static_cast<int32>(SearchMode), static_cast<int32>(Category), *TrimmedQuery.ToLower());
    double Now = FPlatformTime::Seconds();

    // 1. Check LRU Cache
    {
        FScopeLock Lock(&CacheLock);
        if (FCachedSearchResult* Found = SearchCache.Find(CacheKey))
        {
            if (Now - Found->Timestamp < CacheTTLSeconds)
            {
                // Cache hit - update LRU order
                CacheAccessOrder.Remove(CacheKey);
                CacheAccessOrder.Add(CacheKey);

                TArray<FEyefindSearchResultItem> CachedResults = Found->Results;
                // Dispatch next frame on Game Thread
                AsyncTask(ENamedThreads::GameThread, [this, TrimmedQuery, CachedResults]()
                {
                    OnSearchCompleted.Broadcast(true, TrimmedQuery, CachedResults);
                });
                return;
            }
            else
            {
                SearchCache.Remove(CacheKey);
                CacheAccessOrder.Remove(CacheKey);
            }
        }
    }

    // 2. Rate Limit Verification
    if (!TryConsumeRateLimitToken())
    {
        UE_LOG(LogTemp, Warning, TEXT("[Eyefind] Search query rate limited: %s"), *TrimmedQuery);
        OnSearchCompleted.Broadcast(false, TrimmedQuery, TArray<FEyefindSearchResultItem>());
        return;
    }

    // 3. Build Non-blocking Asynchronous Request
    FString ModeStr = (SearchMode == EEyefindSearchMode::Satire) ? TEXT("satire") : ((SearchMode == EEyefindSearchMode::Direct) ? TEXT("direct") : TEXT("raw"));
    FString CategoryStr = TEXT("all");
    switch (Category)
    {
    case EEyefindSearchCategory::News: CategoryStr = TEXT("news"); break;
    case EEyefindSearchCategory::Stocks: CategoryStr = TEXT("stocks"); break;
    case EEyefindSearchCategory::Social: CategoryStr = TEXT("social"); break;
    case EEyefindSearchCategory::Commerce: CategoryStr = TEXT("commerce"); break;
    default: break;
    }

    FString EncodedQuery = FGenericPlatformHttp::UrlEncode(TrimmedQuery);
    FString TargetURL = FString::Printf(TEXT("%s/api/v1/search?q=%s&mode=%s&category=%s"), *GatewayBaseURL, *EncodedQuery, *ModeStr, *CategoryStr);

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(TargetURL);
    Request->SetVerb(TEXT("GET"));
    Request->SetHeader(TEXT("User-Agent"), TEXT("GTA6-Eyefind-Engine/1.0 (UnrealEngine5.5; ViceCityClient)"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    Request->SetTimeout(8.0f);

    Request->OnProcessRequestComplete().BindUObject(this, &UGameInternetSubsystem::OnSearchResponseReceived, TrimmedQuery, CacheKey);
    Request->ProcessRequest();
}

void UGameInternetSubsystem::OnSearchResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully, FString OriginalQuery, FString CacheKey)
{
    if (!bConnectedSuccessfully || !Response.IsValid() || Response->GetResponseCode() != 200)
    {
        int32 Code = Response.IsValid() ? Response->GetResponseCode() : -1;
        UE_LOG(LogTemp, Error, TEXT("[Eyefind] HTTP Search request failed (Code: %d) for query: %s"), Code, *OriginalQuery);
        OnSearchCompleted.Broadcast(false, OriginalQuery, TArray<FEyefindSearchResultItem>());
        return;
    }

    FString JsonString = Response->GetContentAsString();

    // Offload JSON parsing to Background Thread Pool so render/game thread never hitches
    AsyncTask(ENamedThreads::AnyBackgroundThreadNormalTask, [this, JsonString, OriginalQuery, CacheKey]()
    {
        TArray<FEyefindSearchResultItem> ParsedItems;
        bool bSuccess = ParseSearchJson(JsonString, ParsedItems);

        if (bSuccess)
        {
            // Update LRU Cache thread-safely using consistent multi-part key
            FScopeLock Lock(&CacheLock);

            if (SearchCache.Num() >= MaxCacheEntries && CacheAccessOrder.Num() > 0)
            {
                FString EvictKey = CacheAccessOrder[0];
                CacheAccessOrder.RemoveAt(0);
                SearchCache.Remove(EvictKey);
            }

            FCachedSearchResult NewEntry;
            NewEntry.Results = ParsedItems;
            NewEntry.Timestamp = FPlatformTime::Seconds();

            SearchCache.Add(CacheKey, NewEntry);
            CacheAccessOrder.Remove(CacheKey);
            CacheAccessOrder.Add(CacheKey);
        }

        // Return to Game Thread for dynamic event broadcast
        AsyncTask(ENamedThreads::GameThread, [this, bSuccess, OriginalQuery, ParsedItems]()
        {
            OnSearchCompleted.Broadcast(bSuccess, OriginalQuery, ParsedItems);
        });
    });
}

bool UGameInternetSubsystem::ParseSearchJson(const FString& JsonString, TArray<FEyefindSearchResultItem>& OutItems)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        return false;
    }

    const TArray<TSharedPtr<FJsonValue>>* ResultsArray;
    if (!JsonObject->TryGetArrayField(TEXT("results"), ResultsArray))
    {
        return false;
    }

    for (const TSharedPtr<FJsonValue>& Val : *ResultsArray)
    {
        TSharedPtr<FJsonObject> ItemObj = Val->AsObject();
        if (!ItemObj.IsValid()) continue;

        FEyefindSearchResultItem Item;
        Item.Title = SanitizeString(ItemObj->GetStringField(TEXT("title")));
        Item.Snippet = SanitizeString(ItemObj->GetStringField(TEXT("snippet")));
        Item.SourceURL = ItemObj->GetStringField(TEXT("source_url"));
        Item.ThumbnailURL = ItemObj->GetStringField(TEXT("thumbnail_url"));
        Item.SatiricalAuthor = ItemObj->HasField(TEXT("satirical_author")) ? ItemObj->GetStringField(TEXT("satirical_author")) : TEXT("Weazel News Correspondent");
        Item.InGameMarketImpact = ItemObj->HasField(TEXT("market_impact")) ? static_cast<float>(ItemObj->GetNumberField(TEXT("market_impact"))) : 0.0f;

        OutItems.Add(Item);
    }

    return true;
}

void UGameInternetSubsystem::RequestBAWSAQUpdate()
{
    if (!TryConsumeRateLimitToken()) return;

    FString TargetURL = FString::Printf(TEXT("%s/api/v1/stocks/bawsaq"), *GatewayBaseURL);

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(TargetURL);
    Request->SetVerb(TEXT("GET"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    Request->SetTimeout(6.0f);

    Request->OnProcessRequestComplete().BindUObject(this, &UGameInternetSubsystem::OnStocksResponseReceived);
    Request->ProcessRequest();
}

void UGameInternetSubsystem::OnStocksResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully)
{
    if (!bConnectedSuccessfully || !Response.IsValid() || Response->GetResponseCode() != 200)
    {
        OnBAWSAQUpdated.Broadcast(false, TArray<FBAWSAQStockData>());
        return;
    }

    FString JsonString = Response->GetContentAsString();
    AsyncTask(ENamedThreads::AnyBackgroundThreadNormalTask, [this, JsonString]()
    {
        TArray<FBAWSAQStockData> OutStocks;
        bool bParsed = ParseStocksJson(JsonString, OutStocks);

        AsyncTask(ENamedThreads::GameThread, [this, bParsed, OutStocks]()
        {
            OnBAWSAQUpdated.Broadcast(bParsed, OutStocks);
        });
    });
}

bool UGameInternetSubsystem::ParseStocksJson(const FString& JsonString, TArray<FBAWSAQStockData>& OutStocks)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        return false;
    }

    const TArray<TSharedPtr<FJsonValue>>* StocksArray;
    if (!JsonObject->TryGetArrayField(TEXT("stocks"), StocksArray))
    {
        return false;
    }

    for (const TSharedPtr<FJsonValue>& Val : *StocksArray)
    {
        TSharedPtr<FJsonObject> ItemObj = Val->AsObject();
        if (!ItemObj.IsValid()) continue;

        FBAWSAQStockData Stock;
        Stock.Ticker = ItemObj->GetStringField(TEXT("ticker"));
        Stock.CompanyName = ItemObj->GetStringField(TEXT("company_name"));
        Stock.RealWorldEquivalent = ItemObj->GetStringField(TEXT("real_ticker"));
        Stock.CurrentPrice = static_cast<float>(ItemObj->GetNumberField(TEXT("price")));
        Stock.DailyChangePercent = static_cast<float>(ItemObj->GetNumberField(TEXT("change_percent")));
        Stock.TrendingDescription = SanitizeString(ItemObj->GetStringField(TEXT("description")));

        OutStocks.Add(Stock);
    }

    return true;
}

FString UGameInternetSubsystem::SanitizeString(const FString& InRaw)
{
    FString Result = InRaw;

    // Remove tags including attributes using string stripping
    auto StripTagWithAttributes = [](FString& Str, const FString& TagName)
    {
        int32 OpenPos = 0;
        while ((OpenPos = Str.Find(TEXT("<") + TagName, ESearchCase::IgnoreCase, ESearchDir::FromStart, OpenPos)) != INDEX_NONE)
        {
            int32 ClosePos = Str.Find(TEXT(">"), ESearchCase::IgnoreCase, ESearchDir::FromStart, OpenPos);
            if (ClosePos != INDEX_NONE)
            {
                Str.RemoveAt(OpenPos, (ClosePos - OpenPos) + 1);
            }
            else
            {
                break;
            }
        }
        Str.ReplaceInline(*(TEXT("</") + TagName + TEXT(">")), TEXT(""), ESearchCase::IgnoreCase);
    };

    StripTagWithAttributes(Result, TEXT("script"));
    StripTagWithAttributes(Result, TEXT("iframe"));
    StripTagWithAttributes(Result, TEXT("object"));
    StripTagWithAttributes(Result, TEXT("embed"));

    // Neutralize dangerous protocol schemes
    Result.ReplaceInline(TEXT("javascript:"), TEXT(""), ESearchCase::IgnoreCase);
    Result.ReplaceInline(TEXT("data:text/html"), TEXT(""), ESearchCase::IgnoreCase);

    // Decode safe HTML entities
    Result.ReplaceInline(TEXT("&amp;"), TEXT("&"));
    Result.ReplaceInline(TEXT("&quot;"), TEXT("\""));
    Result.ReplaceInline(TEXT("&apos;"), TEXT("'"));
    Result.ReplaceInline(TEXT("&lt;"), TEXT("<"));
    Result.ReplaceInline(TEXT("&gt;"), TEXT(">"));

    return Result;
}
