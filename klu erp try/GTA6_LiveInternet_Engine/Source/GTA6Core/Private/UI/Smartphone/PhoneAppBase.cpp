// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "UI/Smartphone/PhoneAppBase.h"
#include "UI/Smartphone/SmartphoneManagerComponent.h"
#include "UI/Smartphone/SmartphoneScreenWidget.h"

UPhoneAppBase::UPhoneAppBase(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    AppDisplayName = FText::FromString(TEXT("App"));
    NotificationBadgeCount = 0;
    bIsAppRunning = false;
    bIsAppSuspended = false;
}

void UPhoneAppBase::NativeOnAppLaunched(const FString& LaunchParams)
{
    bIsAppRunning = true;
    bIsAppSuspended = false;
    K2_OnAppLaunched(LaunchParams);
}

void UPhoneAppBase::NativeOnAppSuspended()
{
    bIsAppSuspended = true;
    K2_OnAppSuspended();
}

void UPhoneAppBase::NativeOnAppResumed()
{
    bIsAppSuspended = false;
    K2_OnAppResumed();
}

void UPhoneAppBase::NativeOnAppTerminated()
{
    bIsAppRunning = false;
    bIsAppSuspended = false;
    K2_OnAppTerminated();
}

bool UPhoneAppBase::NativeOnBackButtonPressed()
{
    // Check if Blueprint overrides back button logic
    return K2_OnBackButtonPressed();
}

void UPhoneAppBase::NativeOnAppTick(float DeltaTime)
{
    // Optional per-app native tick
}

USmartphoneManagerComponent* UPhoneAppBase::GetSmartphoneManager() const
{
    return CachedManagerComponent.Get();
}

USmartphoneScreenWidget* UPhoneAppBase::GetSmartphoneScreenWidget() const
{
    return CachedScreenWidget.Get();
}

void UPhoneAppBase::SetNotificationBadgeCount(int32 NewCount)
{
    const int32 ClampedCount = FMath::Max(0, NewCount);
    if (NotificationBadgeCount != ClampedCount)
    {
        NotificationBadgeCount = ClampedCount;
        OnBadgeCountChanged.Broadcast(NotificationBadgeCount);
    }
}

void UPhoneAppBase::RequestCloseApp()
{
    if (USmartphoneManagerComponent* Manager = GetSmartphoneManager())
    {
        Manager->NavigateToHomeScreen();
    }
}

void UPhoneAppBase::PlayHapticFeedback(const FString& FeedbackPattern)
{
    if (USmartphoneManagerComponent* Manager = GetSmartphoneManager())
    {
        Manager->PlayPhoneHaptic(FeedbackPattern);
    }
}
