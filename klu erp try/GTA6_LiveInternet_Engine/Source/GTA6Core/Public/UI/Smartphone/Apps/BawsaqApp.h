// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UI/Smartphone/PhoneAppBase.h"
#include "Internet/GameInternetSubsystem.h"
#include "BawsaqApp.generated.h"

USTRUCT(BlueprintType)
struct FPlayerStockHolding
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    FString Ticker;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    FString CompanyName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    int32 SharesOwned = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    float AverageBuyPrice = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    float CurrentPrice = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    float TotalInvestment = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    float CurrentValue = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    float ProfitLossAmount = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Portfolio")
    float ProfitLossPercent = 0.0f;
};

UENUM(BlueprintType)
enum class EBAWSAQMarketFilter : uint8
{
    AllStocks       UMETA(DisplayName = "All Markets"),
    TopGainers      UMETA(DisplayName = "Top Gainers (Bull)"),
    TopLosers       UMETA(DisplayName = "Top Losers (Bear)"),
    MyPortfolio     UMETA(DisplayName = "My Portfolio")
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBAWSAQAppMarketRefreshed, const TArray<FBAWSAQStockData>&, Stocks);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_FourParams(FOnBAWSAQStockTradeExecuted, bool, bSuccess, const FString&, Ticker, int32, ShareCount, float, TotalAmount);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnBAWSAQPortfolioUpdated, float, TotalPortfolioValue, float, TotalNetProfit);

/**
 * AAA BAWSAQ & LCN In-Game Stock Exchange Application for the Smartphone.
 * Provides real-time stock quotes, interactive buy/sell trading desk,
 * portfolio tracking, and real-time open-world crime/assassination market influences.
 */
UCLASS()
class GTA6CORE_API UBawsaqApp : public UPhoneAppBase
{
    GENERATED_BODY()

public:
    UBawsaqApp(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;
    virtual void NativeDestruct() override;

    // App Lifecycle Overrides
    virtual void NativeOnAppLaunched(const FString& LaunchParams) override;
    virtual void NativeOnAppResumed() override;

    // Trading API
    UFUNCTION(BlueprintCallable, Category = "BAWSAQ Trading")
    bool ExecuteBuyOrder(const FString& Ticker, int32 Quantity);

    UFUNCTION(BlueprintCallable, Category = "BAWSAQ Trading")
    bool ExecuteSellOrder(const FString& Ticker, int32 Quantity);

    UFUNCTION(BlueprintCallable, Category = "BAWSAQ Trading")
    bool ExecuteSellAllShares(const FString& Ticker);

    UFUNCTION(BlueprintCallable, Category = "BAWSAQ Trading")
    void RefreshMarketQuotes();

    UFUNCTION(BlueprintPure, Category = "BAWSAQ Trading")
    TArray<FBAWSAQStockData> GetFilteredStocks(EBAWSAQMarketFilter FilterMode) const;

    UFUNCTION(BlueprintPure, Category = "BAWSAQ Trading")
    bool GetStockQuote(const FString& Ticker, FBAWSAQStockData& OutStock) const;

    UFUNCTION(BlueprintPure, Category = "BAWSAQ Portfolio")
    TArray<FPlayerStockHolding> GetPlayerPortfolio() const;

    UFUNCTION(BlueprintPure, Category = "BAWSAQ Portfolio")
    float GetPlayerCashBalance() const { return PlayerCashBalance; }

    UFUNCTION(BlueprintPure, Category = "BAWSAQ Portfolio")
    float GetTotalPortfolioValue() const;

    UFUNCTION(BlueprintPure, Category = "BAWSAQ Portfolio")
    float GetTotalNetProfitLoss() const;

    // Event Dispatchers
    UPROPERTY(BlueprintAssignable, Category = "BAWSAQ|Events")
    FOnBAWSAQAppMarketRefreshed OnMarketRefreshed;

    UPROPERTY(BlueprintAssignable, Category = "BAWSAQ|Events")
    FOnBAWSAQStockTradeExecuted OnTradeExecuted;

    UPROPERTY(BlueprintAssignable, Category = "BAWSAQ|Events")
    FOnBAWSAQPortfolioUpdated OnPortfolioUpdated;

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "BAWSAQ|State")
    TArray<FBAWSAQStockData> CachedStocks;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "BAWSAQ|State")
    TMap<FString, FPlayerStockHolding> PlayerHoldings;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "BAWSAQ|Player")
    float PlayerCashBalance = 250000.0f; // Default starting test balance ($250k)

private:
    UFUNCTION()
    void HandleSubsystemStocksUpdated(bool bSuccess, const TArray<FBAWSAQStockData>& Stocks);

    void RecalculatePortfolioMetrics();
    void PopulateInitialMarketList();
};
