// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "UI/Smartphone/Apps/EyefindApp.h"
#include "UI/Slate/SEyefindBrowserWidget.h"
#include "Internet/GameInternetSubsystem.h"
#include "Kismet/GameplayStatics.h"
#include "GenericPlatform/GenericPlatformHttp.h"

UEyefindApp::UEyefindApp(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    AppID = EPhoneAppID::EyefindBrowser;
    AppDisplayName = FText::FromString(TEXT("Eyefind"));
    PreferredStatusBarTheme = EPhoneStatusBarTheme::LightIcons;
    bRequiresInternet = true;
    bCanBeBackgrounded = true;
    CurrentActiveURL = DefaultHomePageURL;
}

void UEyefindApp::NativeConstruct()
{
    Super::NativeConstruct();

    if (UGameInstance* GI = GetGameInstance())
    {
        if (UGameInternetSubsystem* InternetSubsystem = GI->GetSubsystem<UGameInternetSubsystem>())
        {
            InternetSubsystem->OnSearchCompleted.AddDynamic(this, &UEyefindApp::HandleSubsystemSearchResults);
        }
    }
}

void UEyefindApp::NativeDestruct()
{
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UGameInternetSubsystem* InternetSubsystem = GI->GetSubsystem<UGameInternetSubsystem>())
        {
            InternetSubsystem->OnSearchCompleted.RemoveDynamic(this, &UEyefindApp::HandleSubsystemSearchResults);
        }
    }

    SlateBrowserWidget.Reset();
    Super::NativeDestruct();
}

TSharedRef<SWidget> UEyefindApp::RebuildWidget()
{
    SlateBrowserWidget = SNew(SEyefindBrowserWidget)
        .InitialURL(CurrentActiveURL)
        .bEnableGamepadThumbstickCursor(true)
        .OnUrlNavigated(FOnEyefindUrlNavigated::CreateUObject(this, &UEyefindApp::HandleSlateUrlNavigated))
        .OnTitleChanged(FOnEyefindTitleChanged::CreateUObject(this, &UEyefindApp::HandleSlateTitleChanged));

    return SlateBrowserWidget.ToSharedRef();
}

void UEyefindApp::NativeOnAppLaunched(const FString& LaunchParams)
{
    Super::NativeOnAppLaunched(LaunchParams);

    if (!LaunchParams.IsEmpty())
    {
        OpenURL(LaunchParams);
    }
    else if (CurrentActiveURL.IsEmpty())
    {
        OpenURL(DefaultHomePageURL);
    }
}

void UEyefindApp::NativeOnAppSuspended()
{
    Super::NativeOnAppSuspended();
}

void UEyefindApp::NativeOnAppResumed()
{
    Super::NativeOnAppResumed();
}

bool UEyefindApp::NativeOnBackButtonPressed()
{
    if (SlateBrowserWidget.IsValid())
    {
        SlateBrowserWidget->NavigateBack();
        return true; // Consumed back action
    }
    return false;
}

void UEyefindApp::OpenURL(const FString& InURL)
{
    CurrentActiveURL = InURL;
    if (SlateBrowserWidget.IsValid())
    {
        SlateBrowserWidget->NavigateToURL(InURL);
    }
}

void UEyefindApp::PerformSearch(const FString& SearchQuery, EEyefindSearchMode Mode)
{
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UGameInternetSubsystem* InternetSubsystem = GI->GetSubsystem<UGameInternetSubsystem>())
        {
            InternetSubsystem->ExecuteSearchQuery(SearchQuery, Mode);
        }
    }

    // Also update URL in browser
    const FString FormattedURL = FString::Printf(TEXT("https://www.eyefind.info/search?q=%s"), *FGenericPlatformHttp::UrlEncode(SearchQuery));
    OpenURL(FormattedURL);
}

void UEyefindApp::GoBack()
{
    if (SlateBrowserWidget.IsValid())
    {
        SlateBrowserWidget->NavigateBack();
    }
}

void UEyefindApp::GoForward()
{
    if (SlateBrowserWidget.IsValid())
    {
        SlateBrowserWidget->NavigateForward();
    }
}

void UEyefindApp::RefreshCurrentPage()
{
    if (SlateBrowserWidget.IsValid())
    {
        SlateBrowserWidget->RefreshPage();
    }
}

void UEyefindApp::HandleSlateUrlNavigated(const FString& NewURL)
{
    CurrentActiveURL = NewURL;
    OnPageLoaded.Broadcast(NewURL);
}

void UEyefindApp::HandleSlateTitleChanged(const FString& TabID, const FString& NewTitle)
{
    // Update active tab or title metrics
}

void UEyefindApp::HandleSubsystemSearchResults(bool bSuccess, const FString& Query, const TArray<FEyefindSearchResultItem>& Results)
{
    if (bSuccess)
    {
        LastSearchResults = Results;
        OnSearchResultsReady.Broadcast(Query, Results);
    }
}
