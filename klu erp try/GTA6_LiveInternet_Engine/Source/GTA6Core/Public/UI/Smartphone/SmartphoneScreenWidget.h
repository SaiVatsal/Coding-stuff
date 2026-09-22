// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "UI/Smartphone/PhoneAppBase.h"
#include "SmartphoneScreenWidget.generated.h"

class UPhoneAppBase;
class USmartphoneManagerComponent;

UENUM(BlueprintType)
enum class EDynamicIslandState : uint8
{
    CollapsedDefault,
    IncomingCall,
    ActiveCall,
    GPSNavigationTurn,
    MusicPlaying,
    NotificationAlert
};

USTRUCT(BlueprintType)
struct FPhoneToastNotification
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Notification")
    FString NotificationID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Notification")
    EPhoneAppID SourceAppID = EPhoneAppID::HomeScreen;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Notification")
    FText Title;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Notification")
    FText Message;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Notification")
    FSlateBrush AppIcon;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Notification")
    float DurationSeconds = 4.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Notification")
    FString DeepLinkParam;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnPhoneAppSwitched, EPhoneAppID, PreviousAppID, EPhoneAppID, NewAppID);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDynamicIslandStateChanged, EDynamicIslandState, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnToastNotificationTriggered, const FPhoneToastNotification&, Notification);

/**
 * Master UMG Screen Widget for the in-game iFruit / Eyefind Smartphone.
 * Manages the top status bar, Dynamic Island / notch state machine, app navigation container,
 * gesture bar, and interactive floating toast notifications.
 */
UCLASS(BlueprintType, Blueprintable)
class GTA6CORE_API USmartphoneScreenWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    USmartphoneScreenWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;
    virtual void NativeDestruct() override;
    virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

    // App Navigation Management
    UFUNCTION(BlueprintCallable, Category = "Smartphone Screen")
    void LaunchApp(EPhoneAppID AppID, const FString& LaunchParams = TEXT(""));

    UFUNCTION(BlueprintCallable, Category = "Smartphone Screen")
    void CloseActiveApp();

    UFUNCTION(BlueprintCallable, Category = "Smartphone Screen")
    void NavigateToHomeScreen();

    UFUNCTION(BlueprintCallable, Category = "Smartphone Screen")
    bool HandleBackAction();

    UFUNCTION(BlueprintPure, Category = "Smartphone Screen")
    UPhoneAppBase* GetActiveAppWidget() const { return ActiveAppInstance; }

    UFUNCTION(BlueprintPure, Category = "Smartphone Screen")
    EPhoneAppID GetActiveAppID() const { return CurrentActiveAppID; }

    UFUNCTION(BlueprintPure, Category = "Smartphone Screen")
    UPhoneAppBase* GetAppInstance(EPhoneAppID AppID);

    // Dynamic Island State Machine
    UFUNCTION(BlueprintCallable, Category = "Smartphone Dynamic Island")
    void SetDynamicIslandState(EDynamicIslandState NewState, const FString& CustomMessage = TEXT(""));

    UFUNCTION(BlueprintPure, Category = "Smartphone Dynamic Island")
    EDynamicIslandState GetDynamicIslandState() const { return DynamicIslandState; }

    // Toast Notifications
    UFUNCTION(BlueprintCallable, Category = "Smartphone Notifications")
    void ShowToastNotification(const FPhoneToastNotification& Notification);

    UFUNCTION(BlueprintCallable, Category = "Smartphone Notifications")
    void DismissActiveToast();

    UFUNCTION(BlueprintCallable, Category = "Smartphone Notifications")
    void ClickActiveToast();

    // Status Bar & Battery API
    UFUNCTION(BlueprintCallable, Category = "Smartphone Status")
    void SetBatteryLevel(float InBatteryPercentage, bool bInIsCharging = false);

    UFUNCTION(BlueprintCallable, Category = "Smartphone Status")
    void SetCellularSignalLevel(int32 Bars); // 0 - 4

    UFUNCTION(BlueprintCallable, Category = "Smartphone Status")
    void SetWiFiConnected(bool bConnected);

    UFUNCTION(BlueprintPure, Category = "Smartphone Status")
    FString GetFormattedClockTime() const;

    UFUNCTION(BlueprintPure, Category = "Smartphone Status")
    float GetBatteryPercentage() const { return BatteryPercentage; }

    UFUNCTION(BlueprintPure, Category = "Smartphone Status")
    bool IsBatteryCharging() const { return bIsCharging; }

    UFUNCTION(BlueprintPure, Category = "Smartphone Status")
    int32 GetCellularSignalBars() const { return CellularSignalBars; }

    UFUNCTION(BlueprintPure, Category = "Smartphone Status")
    bool IsWiFiConnected() const { return bWiFiConnected; }

    // Register App Class Types
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Smartphone Screen|App Registry")
    TMap<EPhoneAppID, TSubclassOf<UPhoneAppBase>> RegisteredAppClasses;

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Smartphone Screen|Events")
    FOnPhoneAppSwitched OnAppSwitched;

    UPROPERTY(BlueprintAssignable, Category = "Smartphone Screen|Events")
    FOnDynamicIslandStateChanged OnDynamicIslandStateChanged;

    UPROPERTY(BlueprintAssignable, Category = "Smartphone Screen|Events")
    FOnToastNotificationTriggered OnToastTriggered;

    void SetManagerComponent(USmartphoneManagerComponent* InManager);

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|State")
    EPhoneAppID CurrentActiveAppID = EPhoneAppID::HomeScreen;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|State")
    TObjectPtr<UPhoneAppBase> ActiveAppInstance;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|State")
    TMap<EPhoneAppID, TObjectPtr<UPhoneAppBase>> InstantiatedApps;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|State")
    TArray<EPhoneAppID> NavigationHistoryStack;

    // Status Bar State
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Smartphone Screen|Status")
    float BatteryPercentage = 84.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Smartphone Screen|Status")
    bool bIsCharging = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Smartphone Screen|Status")
    int32 CellularSignalBars = 4;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Smartphone Screen|Status")
    bool bWiFiConnected = true;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|Dynamic Island")
    EDynamicIslandState DynamicIslandState = EDynamicIslandState::CollapsedDefault;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|Dynamic Island")
    FString DynamicIslandCustomText;

    // Active Toast State
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|Toasts")
    bool bHasActiveToast = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|Toasts")
    FPhoneToastNotification ActiveToastData;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone Screen|Toasts")
    float ToastTimer = 0.0f;

    UPROPERTY(BlueprintReadOnly, Category = "Smartphone Screen|References")
    TWeakObjectPtr<USmartphoneManagerComponent> ManagerComponent;

private:
    void UpdateStatusBarTheme(EPhoneStatusBarTheme NewTheme);
    void TickClockSimulation(float DeltaTime);

    float SimulatedWorldClockHours = 14.0f;
    float SimulatedWorldClockMinutes = 35.0f;
};
