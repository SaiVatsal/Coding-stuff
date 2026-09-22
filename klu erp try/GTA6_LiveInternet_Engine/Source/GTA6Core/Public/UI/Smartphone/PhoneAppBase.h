// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "PhoneAppBase.generated.h"

class USmartphoneManagerComponent;
class USmartphoneScreenWidget;

UENUM(BlueprintType)
enum class EPhoneAppID : uint8
{
    HomeScreen          UMETA(DisplayName = "Home Screen"),
    EyefindBrowser      UMETA(DisplayName = "Eyefind Browser"),
    BAWSAQStocks        UMETA(DisplayName = "BAWSAQ Market"),
    BleeterSocial       UMETA(DisplayName = "Bleeter & Reelz"),
    Messages            UMETA(DisplayName = "WhatUp Messages"),
    Contacts            UMETA(DisplayName = "Contacts & Calls"),
    Camera              UMETA(DisplayName = "iFruit Camera"),
    GPSMap              UMETA(DisplayName = "Vice City GPS"),
    MusicPlayer         UMETA(DisplayName = "Radio & Music"),
    Settings            UMETA(DisplayName = "Phone Settings")
};

UENUM(BlueprintType)
enum class EPhoneStatusBarTheme : uint8
{
    DarkIcons           UMETA(DisplayName = "Dark Icons (Light Background)"),
    LightIcons          UMETA(DisplayName = "Light Icons (Dark Background)"),
    Transparent         UMETA(DisplayName = "Transparent Over App Content"),
    Hidden              UMETA(DisplayName = "Hidden / Full Screen")
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnPhoneAppNotificationReceived, const FString&, Title, const FString&, Message);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPhoneAppBadgeCountChanged, int32, NewBadgeCount);

/**
 * Base UMG UserWidget for all in-game Smartphone Applications.
 * Defines standard application lifecycles, navigation stack hooks, status bar styling,
 * and seamless integration with the Smartphone Manager & Render Targets.
 */
UCLASS(Abstract, BlueprintType, Blueprintable)
class GTA6CORE_API UPhoneAppBase : public UUserWidget
{
    GENERATED_BODY()

public:
    UPhoneAppBase(const FObjectInitializer& ObjectInitializer);

    // App Metadata
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Phone App|Metadata")
    EPhoneAppID AppID = EPhoneAppID::HomeScreen;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Phone App|Metadata")
    FText AppDisplayName;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Phone App|Metadata")
    FSlateBrush AppIconBrush;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Phone App|Metadata")
    EPhoneStatusBarTheme PreferredStatusBarTheme = EPhoneStatusBarTheme::LightIcons;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Phone App|Metadata")
    bool bRequiresInternet = false;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Phone App|Metadata")
    bool bCanBeBackgrounded = true;

    // Application Lifecycle Callbacks (Native)
    virtual void NativeOnAppLaunched(const FString& LaunchParams);
    virtual void NativeOnAppSuspended();
    virtual void NativeOnAppResumed();
    virtual void NativeOnAppTerminated();
    virtual bool NativeOnBackButtonPressed();
    virtual void NativeOnAppTick(float DeltaTime);

    // Application Lifecycle Events (Blueprint)
    UFUNCTION(BlueprintImplementableEvent, Category = "Phone App|Lifecycle", meta = (DisplayName = "On App Launched"))
    void K2_OnAppLaunched(const FString& LaunchParams);

    UFUNCTION(BlueprintImplementableEvent, Category = "Phone App|Lifecycle", meta = (DisplayName = "On App Suspended"))
    void K2_OnAppSuspended();

    UFUNCTION(BlueprintImplementableEvent, Category = "Phone App|Lifecycle", meta = (DisplayName = "On App Resumed"))
    void K2_OnAppResumed();

    UFUNCTION(BlueprintImplementableEvent, Category = "Phone App|Lifecycle", meta = (DisplayName = "On App Terminated"))
    void K2_OnAppTerminated();

    UFUNCTION(BlueprintImplementableEvent, Category = "Phone App|Lifecycle", meta = (DisplayName = "On Back Button Pressed"))
    bool K2_OnBackButtonPressed();

    // Helper Accessors
    UFUNCTION(BlueprintPure, Category = "Phone App")
    USmartphoneManagerComponent* GetSmartphoneManager() const;

    UFUNCTION(BlueprintPure, Category = "Phone App")
    USmartphoneScreenWidget* GetSmartphoneScreenWidget() const;

    UFUNCTION(BlueprintCallable, Category = "Phone App")
    void SetNotificationBadgeCount(int32 NewCount);

    UFUNCTION(BlueprintPure, Category = "Phone App")
    int32 GetNotificationBadgeCount() const { return NotificationBadgeCount; }

    UFUNCTION(BlueprintCallable, Category = "Phone App")
    void RequestCloseApp();

    UFUNCTION(BlueprintCallable, Category = "Phone App")
    void PlayHapticFeedback(const FString& FeedbackPattern = TEXT("LightClick"));

    // Event Dispatchers
    UPROPERTY(BlueprintAssignable, Category = "Phone App|Events")
    FOnPhoneAppNotificationReceived OnNotificationReceived;

    UPROPERTY(BlueprintAssignable, Category = "Phone App|Events")
    FOnPhoneAppBadgeCountChanged OnBadgeCountChanged;

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Phone App|State")
    int32 NotificationBadgeCount = 0;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Phone App|State")
    bool bIsAppRunning = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Phone App|State")
    bool bIsAppSuspended = false;

    UPROPERTY(BlueprintReadOnly, Category = "Phone App|References")
    TWeakObjectPtr<USmartphoneManagerComponent> CachedManagerComponent;

    UPROPERTY(BlueprintReadOnly, Category = "Phone App|References")
    TWeakObjectPtr<USmartphoneScreenWidget> CachedScreenWidget;

    friend class USmartphoneScreenWidget;
    friend class USmartphoneManagerComponent;
};
