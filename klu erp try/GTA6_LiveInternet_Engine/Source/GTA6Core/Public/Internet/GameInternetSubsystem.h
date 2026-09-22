// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "GameInternetSubsystem.generated.h"

UENUM(BlueprintType)
enum class EEyefindSearchMode : uint8
{
    Satire          UMETA(DisplayName = "Satirical GTA-ified Mode"),
    Direct          UMETA(DisplayName = "Direct Real-World Web Mode"),
    RawJSON         UMETA(DisplayName = "Raw Structured Data")
};

UENUM(BlueprintType)
enum class EEyefindSearchCategory : uint8
{
    All             UMETA(DisplayName = "All Eyefind"),
    News            UMETA(DisplayName = "Weazel / Vice City News"),
    Stocks          UMETA(DisplayName = "BAWSAQ Stock Market"),
    Social          UMETA(DisplayName = "Bleeter / WhatUp Feed"),
    Commerce        UMETA(DisplayName = "Ammu-Nation / Dynasty8")
};

USTRUCT(BlueprintType)
struct FEyefindSearchResultItem
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Eyefind")
    FString Title;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Eyefind")
    FString Snippet;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Eyefind")
    FString SourceURL;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Eyefind")
    FString ThumbnailURL;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Eyefind")
    FString SatiricalAuthor;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Eyefind")
    float InGameMarketImpact = 0.0f;
};

USTRUCT(BlueprintType)
struct FBAWSAQStockData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "BAWSAQ")
    FString Ticker;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "BAWSAQ")
    FString CompanyName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "BAWSAQ")
    FString RealWorldEquivalent;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "BAWSAQ")
    float CurrentPrice = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "BAWSAQ")
    float DailyChangePercent = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "BAWSAQ")
    FString TrendingDescription;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnEyefindSearchCompleted, bool, bSuccess, const FString&, Query, const TArray<FEyefindSearchResultItem>&, Results);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnBAWSAQMarketUpdated, bool, bSuccess, const TArray<FBAWSAQStockData>&, Stocks);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnLiveRadioBulletinReceived, const FString&, Headline, const FString&, SatiricalAudioURL);

/**
 * Thread-Safe Non-blocking In-Game Internet & Search Subsystem (Eyefind Engine)
 */
UCLASS()
class GTA6CORE_API UGameInternetSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    /** Execute asynchronous search query through Eyefind middleware gateway */
    UFUNCTION(BlueprintCallable, Category = "Eyefind Internet")
    void ExecuteSearchQuery(const FString& QueryString, EEyefindSearchMode SearchMode = EEyefindSearchMode::Satire, EEyefindSearchCategory Category = EEyefindSearchCategory::All);

    /** Fetch live BAWSAQ stock indices mapped to real-world market feeds */
    UFUNCTION(BlueprintCallable, Category = "Eyefind Internet")
    void RequestBAWSAQUpdate();

    /** Clear local in-memory LRU search cache */
    UFUNCTION(BlueprintCallable, Category = "Eyefind Internet")
    void FlushCache();

    /** Set gateway middleware endpoint (Defaults to 127.0.0.1:8080) */
    UFUNCTION(BlueprintCallable, Category = "Eyefind Internet")
    void SetGatewayEndpoint(const FString& InEndpoint);

    // Event Dispatchers
    UPROPERTY(BlueprintAssignable, Category = "Eyefind Internet|Events")
    FOnEyefindSearchCompleted OnSearchCompleted;

    UPROPERTY(BlueprintAssignable, Category = "Eyefind Internet|Events")
    FOnBAWSAQMarketUpdated OnBAWSAQUpdated;

    UPROPERTY(BlueprintAssignable, Category = "Eyefind Internet|Events")
    FOnLiveRadioBulletinReceived OnLiveRadioBulletinReceived;

private:
    struct FCachedSearchResult
    {
        TArray<FEyefindSearchResultItem> Results;
        double Timestamp;
    };

    // Configuration
    FString GatewayBaseURL = TEXT("http://127.0.0.1:8080");
    double CacheTTLSeconds = 300.0; // 5 minutes
    int32 MaxCacheEntries = 64;

    // Rate Limiting (Token Bucket)
    float TokenBucket = 10.0f;
    float MaxTokens = 10.0f;
    float RefillRatePerSecond = 2.0f;
    double LastRefillTime = 0.0;

    // Thread Safety
    FCriticalSection CacheLock;
    TMap<FString, FCachedSearchResult> SearchCache;
    TArray<FString> CacheAccessOrder;

    bool TryConsumeRateLimitToken();
    void RefillRateLimitTokens();

    // HTTP Callbacks
    void OnSearchResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully, FString OriginalQuery, FString CacheKey);
    void OnStocksResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully);

    // Parsing helpers (Background task graph eligible)
    bool ParseSearchJson(const FString& JsonString, TArray<FEyefindSearchResultItem>& OutItems);
    bool ParseStocksJson(const FString& JsonString, TArray<FBAWSAQStockData>& OutStocks);
    FString SanitizeString(const FString& InRaw);
};
