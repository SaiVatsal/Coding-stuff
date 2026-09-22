// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "UI/Smartphone/SmartphoneScreenWidget.h"
#include "UI/Smartphone/SmartphoneManagerComponent.h"
#include "UI/Smartphone/Apps/EyefindApp.h"
#include "UI/Smartphone/Apps/BawsaqApp.h"
#include "UI/Smartphone/Apps/BleeterApp.h"

USmartphoneScreenWidget::USmartphoneScreenWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    CurrentActiveAppID = EPhoneAppID::HomeScreen;
    DynamicIslandState = EDynamicIslandState::CollapsedDefault;
    BatteryPercentage = 84.0f;
    CellularSignalBars = 4;
    bWiFiConnected = true;
    bIsCharging = false;
    SimulatedWorldClockHours = 14.0f;
    SimulatedWorldClockMinutes = 35.0f;

    // Default class registrations
    RegisteredAppClasses.Add(EPhoneAppID::EyefindBrowser, UEyefindApp::StaticClass());
    RegisteredAppClasses.Add(EPhoneAppID::BAWSAQStocks, UBawsaqApp::StaticClass());
    RegisteredAppClasses.Add(EPhoneAppID::BleeterSocial, UBleeterApp::StaticClass());
}

void USmartphoneScreenWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // Default to Home Screen
    NavigateToHomeScreen();
}

void USmartphoneScreenWidget::NativeDestruct()
{
    for (auto& Pair : InstantiatedApps)
    {
        if (Pair.Value)
        {
            Pair.Value->NativeOnAppTerminated();
        }
    }
    InstantiatedApps.Empty();
    ActiveAppInstance = nullptr;

    Super::NativeDestruct();
}

void USmartphoneScreenWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
    Super::NativeTick(MyGeometry, InDeltaTime);

    TickClockSimulation(InDeltaTime);

    // Toast Dismissal Timer
    if (bHasActiveToast)
    {
        ToastTimer -= InDeltaTime;
        if (ToastTimer <= 0.0f)
        {
            DismissActiveToast();
        }
    }

    // Tick active app
    if (ActiveAppInstance)
    {
        ActiveAppInstance->NativeOnAppTick(InDeltaTime);
    }
}

void USmartphoneScreenWidget::LaunchApp(EPhoneAppID AppID, const FString& LaunchParams)
{
    if (AppID == EPhoneAppID::HomeScreen)
    {
        NavigateToHomeScreen();
        return;
    }

    const EPhoneAppID PrevAppID = CurrentActiveAppID;

    // Suspend currently running app
    if (ActiveAppInstance && CurrentActiveAppID != AppID)
    {
        ActiveAppInstance->NativeOnAppSuspended();
        ActiveAppInstance->SetVisibility(ESlateVisibility::Collapsed);
    }

    UPhoneAppBase* TargetApp = GetAppInstance(AppID);
    if (!TargetApp)
    {
        UE_LOG(LogTemp, Warning, TEXT("[Smartphone] Failed to instantiate or find AppID: %d"), static_cast<uint8>(AppID));
        return;
    }

    TargetApp->SetVisibility(ESlateVisibility::Visible);
    TargetApp->NativeOnAppLaunched(LaunchParams);

    ActiveAppInstance = TargetApp;
    CurrentActiveAppID = AppID;

    if (NavigationHistoryStack.Num() == 0 || NavigationHistoryStack.Last() != AppID)
    {
        NavigationHistoryStack.Add(AppID);
    }

    UpdateStatusBarTheme(TargetApp->PreferredStatusBarTheme);

    if (USmartphoneManagerComponent* Mgr = ManagerComponent.Get())
    {
        Mgr->PlayPhoneHaptic(TEXT("AppLaunch"));
    }

    OnAppSwitched.Broadcast(PrevAppID, CurrentActiveAppID);
}

void USmartphoneScreenWidget::CloseActiveApp()
{
    if (ActiveAppInstance)
    {
        ActiveAppInstance->NativeOnAppSuspended();
        ActiveAppInstance->SetVisibility(ESlateVisibility::Collapsed);
        ActiveAppInstance = nullptr;
    }

    NavigateToHomeScreen();
}

void USmartphoneScreenWidget::NavigateToHomeScreen()
{
    const EPhoneAppID PrevAppID = CurrentActiveAppID;

    if (ActiveAppInstance)
    {
        ActiveAppInstance->NativeOnAppSuspended();
        ActiveAppInstance->SetVisibility(ESlateVisibility::Collapsed);
        ActiveAppInstance = nullptr;
    }

    CurrentActiveAppID = EPhoneAppID::HomeScreen;
    NavigationHistoryStack.Empty();
    UpdateStatusBarTheme(EPhoneStatusBarTheme::LightIcons);

    OnAppSwitched.Broadcast(PrevAppID, CurrentActiveAppID);
}

bool USmartphoneScreenWidget::HandleBackAction()
{
    // First, let the active app handle the back button (e.g. browser history back)
    if (ActiveAppInstance)
    {
        if (ActiveAppInstance->NativeOnBackButtonPressed())
        {
            return true;
        }
    }

    // If active app didn't consume back action, pop navigation stack
    if (NavigationHistoryStack.Num() > 1)
    {
        NavigationHistoryStack.Pop(); // Remove current
        const EPhoneAppID PreviousAppID = NavigationHistoryStack.Last();
        LaunchApp(PreviousAppID);
        return true;
    }
    else if (CurrentActiveAppID != EPhoneAppID::HomeScreen)
    {
        NavigateToHomeScreen();
        return true;
    }

    return false;
}

UPhoneAppBase* USmartphoneScreenWidget::GetAppInstance(EPhoneAppID AppID)
{
    if (TObjectPtr<UPhoneAppBase>* Existing = InstantiatedApps.Find(AppID))
    {
        return Existing->Get();
    }

    // Look up registered widget class
    if (TSubclassOf<UPhoneAppBase>* AppClassPtr = RegisteredAppClasses.Find(AppID))
    {
        if (UClass* AppClass = AppClassPtr->Get())
        {
            UPhoneAppBase* NewAppWidget = CreateWidget<UPhoneAppBase>(this, AppClass);
            if (NewAppWidget)
            {
                NewAppWidget->CachedScreenWidget = this;
                NewAppWidget->CachedManagerComponent = ManagerComponent;
                NewAppWidget->SetVisibility(ESlateVisibility::Collapsed);
                InstantiatedApps.Add(AppID, NewAppWidget);
                return NewAppWidget;
            }
        }
    }

    return nullptr;
}

void USmartphoneScreenWidget::SetDynamicIslandState(EDynamicIslandState NewState, const FString& CustomMessage)
{
    if (DynamicIslandState != NewState || DynamicIslandCustomText != CustomMessage)
    {
        DynamicIslandState = NewState;
        DynamicIslandCustomText = CustomMessage;
        OnDynamicIslandStateChanged.Broadcast(DynamicIslandState);
    }
}

void USmartphoneScreenWidget::ShowToastNotification(const FPhoneToastNotification& Notification)
{
    ActiveToastData = Notification;
    bHasActiveToast = true;
    ToastTimer = Notification.DurationSeconds;

    if (USmartphoneManagerComponent* Mgr = ManagerComponent.Get())
    {
        Mgr->PlayPhoneHaptic(TEXT("NotificationBuzz"));
    }

    OnToastTriggered.Broadcast(ActiveToastData);
}

void USmartphoneScreenWidget::DismissActiveToast()
{
    bHasActiveToast = false;
    ToastTimer = 0.0f;
}

void USmartphoneScreenWidget::ClickActiveToast()
{
    if (bHasActiveToast)
    {
        const EPhoneAppID TargetApp = ActiveToastData.SourceAppID;
        const FString DeepLink = ActiveToastData.DeepLinkParam;
        DismissActiveToast();

        if (TargetApp != EPhoneAppID::HomeScreen)
        {
            LaunchApp(TargetApp, DeepLink);
        }
    }
}

void USmartphoneScreenWidget::SetBatteryLevel(float InBatteryPercentage, bool bInIsCharging)
{
    BatteryPercentage = FMath::Clamp(InBatteryPercentage, 0.0f, 100.0f);
    bIsCharging = bInIsCharging;
}

void USmartphoneScreenWidget::SetCellularSignalLevel(int32 Bars)
{
    CellularSignalBars = FMath::Clamp(Bars, 0, 4);
}

void USmartphoneScreenWidget::SetWiFiConnected(bool bConnected)
{
    bWiFiConnected = bConnected;
}

FString USmartphoneScreenWidget::GetFormattedClockTime() const
{
    const int32 HoursInt = FMath::FloorToInt(SimulatedWorldClockHours);
    const int32 MinutesInt = FMath::FloorToInt(SimulatedWorldClockMinutes);
    const int32 DisplayHour = (HoursInt % 12 == 0) ? 12 : (HoursInt % 12);
    const FString AmPm = (HoursInt >= 12) ? TEXT("PM") : TEXT("AM");

    return FString::Printf(TEXT("%02d:%02d %s"), DisplayHour, MinutesInt, *AmPm);
}

void USmartphoneScreenWidget::SetManagerComponent(USmartphoneManagerComponent* InManager)
{
    ManagerComponent = InManager;
    for (auto& Pair : InstantiatedApps)
    {
        if (Pair.Value)
        {
            Pair.Value->CachedManagerComponent = InManager;
        }
    }
}

void USmartphoneScreenWidget::UpdateStatusBarTheme(EPhoneStatusBarTheme NewTheme)
{
    // Blueprint or Slate can bind to PreferredStatusBarTheme or notify visual shaders
}

void USmartphoneScreenWidget::TickClockSimulation(float DeltaTime)
{
    // 1 Real second = 30 In-game seconds (48 minute in-game 24h cycle)
    const float GameMinutesToAdd = (DeltaTime * 30.0f) / 60.0f;
    SimulatedWorldClockMinutes += GameMinutesToAdd;

    if (SimulatedWorldClockMinutes >= 60.0f)
    {
        SimulatedWorldClockHours += FMath::FloorToInt(SimulatedWorldClockMinutes / 60.0f);
        SimulatedWorldClockMinutes = FMath::Fmod(SimulatedWorldClockMinutes, 60.0f);

        if (SimulatedWorldClockHours >= 24.0f)
        {
            SimulatedWorldClockHours = FMath::Fmod(SimulatedWorldClockHours, 24.0f);
        }
    }
}
