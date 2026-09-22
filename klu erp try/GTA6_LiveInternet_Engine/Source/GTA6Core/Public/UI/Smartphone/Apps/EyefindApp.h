// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UI/Smartphone/PhoneAppBase.h"
#include "Internet/GameInternetSubsystem.h"
#include "EyefindApp.generated.h"

class SEyefindBrowserWidget;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnEyefindAppPageLoaded, const FString&, LoadedURL);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnEyefindAppSearchResultsReady, const FString&, Query, const TArray<FEyefindSearchResultItem>&, Results);

/**
 * Mobile Eyefind Browser Application for the in-game iFruit / Eyefind smartphone.
 * Wraps SEyefindBrowserWidget Slate engine, handles mobile-responsive layout,
 * fast-search query autocompletion, and live satirical internet feeds.
 */
UCLASS()
class GTA6CORE_API UEyefindApp : public UPhoneAppBase
{
    GENERATED_BODY()

public:
    UEyefindApp(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;
    virtual void NativeDestruct() override;
    virtual TSharedRef<SWidget> RebuildWidget() override;

    // App Lifecycle Overrides
    virtual void NativeOnAppLaunched(const FString& LaunchParams) override;
    virtual void NativeOnAppSuspended() override;
    virtual void NativeOnAppResumed() override;
    virtual bool NativeOnBackButtonPressed() override;

    // Browser Navigation API
    UFUNCTION(BlueprintCallable, Category = "Eyefind App")
    void OpenURL(const FString& InURL);

    UFUNCTION(BlueprintCallable, Category = "Eyefind App")
    void PerformSearch(const FString& SearchQuery, EEyefindSearchMode Mode = EEyefindSearchMode::Satire);

    UFUNCTION(BlueprintCallable, Category = "Eyefind App")
    void GoBack();

    UFUNCTION(BlueprintCallable, Category = "Eyefind App")
    void GoForward();

    UFUNCTION(BlueprintCallable, Category = "Eyefind App")
    void RefreshCurrentPage();

    UFUNCTION(BlueprintPure, Category = "Eyefind App")
    FString GetCurrentURL() const { return CurrentActiveURL; }

    // Event Dispatchers
    UPROPERTY(BlueprintAssignable, Category = "Eyefind App|Events")
    FOnEyefindAppPageLoaded OnPageLoaded;

    UPROPERTY(BlueprintAssignable, Category = "Eyefind App|Events")
    FOnEyefindAppSearchResultsReady OnSearchResultsReady;

protected:
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Eyefind App|Config")
    FString DefaultHomePageURL = TEXT("https://www.eyefind.info");

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Eyefind App|State")
    FString CurrentActiveURL;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Eyefind App|State")
    TArray<FEyefindSearchResultItem> LastSearchResults;

private:
    TSharedPtr<SEyefindBrowserWidget> SlateBrowserWidget;

    void HandleSlateUrlNavigated(const FString& NewURL);
    void HandleSlateTitleChanged(const FString& TabID, const FString& NewTitle);

    UFUNCTION()
    void HandleSubsystemSearchResults(bool bSuccess, const FString& Query, const TArray<FEyefindSearchResultItem>& Results);
};
