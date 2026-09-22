// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "UI/Smartphone/Apps/BawsaqApp.h"
#include "Internet/GameInternetSubsystem.h"
#include "Kismet/GameplayStatics.h"

UBawsaqApp::UBawsaqApp(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    AppID = EPhoneAppID::BAWSAQStocks;
    AppDisplayName = FText::FromString(TEXT("BAWSAQ"));
    PreferredStatusBarTheme = EPhoneStatusBarTheme::LightIcons;
    bRequiresInternet = true;
    bCanBeBackgrounded = true;
}

void UBawsaqApp::NativeConstruct()
{
    Super::NativeConstruct();

    PopulateInitialMarketList();

    if (UGameInstance* GI = GetGameInstance())
    {
        if (UGameInternetSubsystem* InternetSubsystem = GI->GetSubsystem<UGameInternetSubsystem>())
        {
            InternetSubsystem->OnBAWSAQUpdated.AddDynamic(this, &UBawsaqApp::HandleSubsystemStocksUpdated);
        }
    }
}

void UBawsaqApp::NativeDestruct()
{
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UGameInternetSubsystem* InternetSubsystem = GI->GetSubsystem<UGameInternetSubsystem>())
        {
            InternetSubsystem->OnBAWSAQUpdated.RemoveDynamic(this, &UBawsaqApp::HandleSubsystemStocksUpdated);
        }
    }

    Super::NativeDestruct();
}

void UBawsaqApp::NativeOnAppLaunched(const FString& LaunchParams)
{
    Super::NativeOnAppLaunched(LaunchParams);
    RefreshMarketQuotes();
}

void UBawsaqApp::NativeOnAppResumed()
{
    Super::NativeOnAppResumed();
    RefreshMarketQuotes();
}

void UBawsaqApp::PopulateInitialMarketList()
{
    CachedStocks.Empty();

    CachedStocks.Add({ TEXT("ECL"), TEXT("eCola Corporation"), TEXT("KO"), 142.50f, 3.25f, TEXT("Record high sales in Vice City beach kiosks.") });
    CachedStocks.Add({ TEXT("LFI"), TEXT("Lifeinvader Corp"), TEXT("META"), 88.40f, -4.10f, TEXT("Privacy lawsuits over biometric targeted ads.") });
    CachedStocks.Add({ TEXT("FLY"), TEXT("FlyUS Airways"), TEXT("AAL"), 215.10f, 1.85f, TEXT("Increased international tourism to Leonida.") });
    CachedStocks.Add({ TEXT("AUG"), TEXT("AuguryInsurance"), TEXT("PGR"), 340.00f, -6.80f, TEXT("Heavy insurance claims following high-speed sports car chases.") });
    CachedStocks.Add({ TEXT("BIL"), TEXT("Bilkinton Pharmaceuticals"), TEXT("PFE"), 65.20f, 8.40f, TEXT("New energy drink compound approved for distribution.") });
    CachedStocks.Add({ TEXT("DEB"), TEXT("Debonaire Cigarettes"), TEXT("PM"), 112.75f, 0.45f, TEXT("Stable steady consumer demand.") });
    CachedStocks.Add({ TEXT("MRW"), TEXT("Merryweather Security"), TEXT("LMT"), 490.80f, 5.60f, TEXT("Private maritime defense contracts expanded.") });
    CachedStocks.Add({ TEXT("CLK"), TEXT("Cluckin' Bell"), TEXT("YUM"), 78.30f, -1.20f, TEXT("Factory chicken nugget production efficiency up.") });

    RecalculatePortfolioMetrics();
}

void UBawsaqApp::RefreshMarketQuotes()
{
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UGameInternetSubsystem* InternetSubsystem = GI->GetSubsystem<UGameInternetSubsystem>())
        {
            InternetSubsystem->RequestBAWSAQUpdate();
        }
    }
}

bool UBawsaqApp::ExecuteBuyOrder(const FString& Ticker, int32 Quantity)
{
    if (Quantity <= 0) return false;

    FBAWSAQStockData Quote;
    if (!GetStockQuote(Ticker, Quote)) return false;

    const float TotalCost = Quote.CurrentPrice * Quantity;
    if (PlayerCashBalance < TotalCost)
    {
        UE_LOG(LogTemp, Warning, TEXT("[BAWSAQ] Insufficient funds: Cost $%.2f > Balance $%.2f"), TotalCost, PlayerCashBalance);
        OnTradeExecuted.Broadcast(false, Ticker, Quantity, TotalCost);
        return false;
    }

    PlayerCashBalance -= TotalCost;

    FPlayerStockHolding& Holding = PlayerHoldings.FindOrAdd(Ticker);
    Holding.Ticker = Ticker;
    Holding.CompanyName = Quote.CompanyName;

    const float PrevTotalInvested = Holding.TotalInvestment;
    Holding.SharesOwned += Quantity;
    Holding.TotalInvestment = PrevTotalInvested + TotalCost;
    Holding.AverageBuyPrice = Holding.TotalInvestment / Holding.SharesOwned;
    Holding.CurrentPrice = Quote.CurrentPrice;

    RecalculatePortfolioMetrics();
    PlayHapticFeedback(TEXT("SuccessTrade"));

    OnTradeExecuted.Broadcast(true, Ticker, Quantity, TotalCost);
    return true;
}

bool UBawsaqApp::ExecuteSellOrder(const FString& Ticker, int32 Quantity)
{
    if (Quantity <= 0) return false;

    FPlayerStockHolding* HoldingPtr = PlayerHoldings.Find(Ticker);
    if (!HoldingPtr || HoldingPtr->SharesOwned < Quantity)
    {
        OnTradeExecuted.Broadcast(false, Ticker, Quantity, 0.0f);
        return false;
    }

    FBAWSAQStockData Quote;
    if (!GetStockQuote(Ticker, Quote)) return false;

    const float Revenue = Quote.CurrentPrice * Quantity;
    PlayerCashBalance += Revenue;

    HoldingPtr->SharesOwned -= Quantity;
    if (HoldingPtr->SharesOwned <= 0)
    {
        PlayerHoldings.Remove(Ticker);
    }
    else
    {
        HoldingPtr->TotalInvestment = HoldingPtr->AverageBuyPrice * HoldingPtr->SharesOwned;
        HoldingPtr->CurrentPrice = Quote.CurrentPrice;
    }

    RecalculatePortfolioMetrics();
    PlayHapticFeedback(TEXT("SuccessTrade"));

    OnTradeExecuted.Broadcast(true, Ticker, Quantity, Revenue);
    return true;
}

bool UBawsaqApp::ExecuteSellAllShares(const FString& Ticker)
{
    if (const FPlayerStockHolding* Holding = PlayerHoldings.Find(Ticker))
    {
        return ExecuteSellOrder(Ticker, Holding->SharesOwned);
    }
    return false;
}

TArray<FBAWSAQStockData> UBawsaqApp::GetFilteredStocks(EBAWSAQMarketFilter FilterMode) const
{
    TArray<FBAWSAQStockData> Filtered = CachedStocks;

    switch (FilterMode)
    {
    case EBAWSAQMarketFilter::TopGainers:
        Filtered.Sort([](const FBAWSAQStockData& A, const FBAWSAQStockData& B) {
            return A.DailyChangePercent > B.DailyChangePercent;
        });
        break;
    case EBAWSAQMarketFilter::TopLosers:
        Filtered.Sort([](const FBAWSAQStockData& A, const FBAWSAQStockData& B) {
            return A.DailyChangePercent < B.DailyChangePercent;
        });
        break;
    case EBAWSAQMarketFilter::MyPortfolio:
        Filtered.RemoveAll([this](const FBAWSAQStockData& Item) {
            return !PlayerHoldings.Contains(Item.Ticker);
        });
        break;
    case EBAWSAQMarketFilter::AllStocks:
    default:
        break;
    }

    return Filtered;
}

bool UBawsaqApp::GetStockQuote(const FString& Ticker, FBAWSAQStockData& OutStock) const
{
    for (const FBAWSAQStockData& Stock : CachedStocks)
    {
        if (Stock.Ticker.Equals(Ticker, ESearchCase::IgnoreCase))
        {
            OutStock = Stock;
            return true;
        }
    }
    return false;
}

TArray<FPlayerStockHolding> UBawsaqApp::GetPlayerPortfolio() const
{
    TArray<FPlayerStockHolding> HoldingsList;
    PlayerHoldings.GenerateValueArray(HoldingsList);
    return HoldingsList;
}

float UBawsaqApp::GetTotalPortfolioValue() const
{
    float Total = 0.0f;
    for (const auto& Pair : PlayerHoldings)
    {
        Total += Pair.Value.CurrentValue;
    }
    return Total;
}

float UBawsaqApp::GetTotalNetProfitLoss() const
{
    float TotalProfitLoss = 0.0f;
    for (const auto& Pair : PlayerHoldings)
    {
        TotalProfitLoss += Pair.Value.ProfitLossAmount;
    }
    return TotalProfitLoss;
}

void UBawsaqApp::RecalculatePortfolioMetrics()
{
    for (auto& Pair : PlayerHoldings)
    {
        FPlayerStockHolding& Holding = Pair.Value;
        FBAWSAQStockData Quote;
        if (GetStockQuote(Holding.Ticker, Quote))
        {
            Holding.CurrentPrice = Quote.CurrentPrice;
        }

        Holding.CurrentValue = Holding.SharesOwned * Holding.CurrentPrice;
        Holding.ProfitLossAmount = Holding.CurrentValue - Holding.TotalInvestment;
        Holding.ProfitLossPercent = (Holding.TotalInvestment > 0.0f) ? (Holding.ProfitLossAmount / Holding.TotalInvestment) * 100.0f : 0.0f;
    }

    OnPortfolioUpdated.Broadcast(GetTotalPortfolioValue(), GetTotalNetProfitLoss());
}

void UBawsaqApp::HandleSubsystemStocksUpdated(bool bSuccess, const TArray<FBAWSAQStockData>& Stocks)
{
    if (bSuccess && Stocks.Num() > 0)
    {
        CachedStocks = Stocks;
        RecalculatePortfolioMetrics();
        OnMarketRefreshed.Broadcast(CachedStocks);
    }
}
