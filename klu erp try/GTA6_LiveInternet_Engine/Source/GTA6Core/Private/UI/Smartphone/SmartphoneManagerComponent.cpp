// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "UI/Smartphone/SmartphoneManagerComponent.h"
#include "UI/Smartphone/SmartphoneScreenWidget.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/Pawn.h"
#include "Camera/PlayerCameraManager.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"
#include "Engine/TextureRenderTarget2D.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Framework/Application/SlateApplication.h"
#include "Components/PrimitiveComponent.h"

USmartphoneManagerComponent::USmartphoneManagerComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
    PrimaryComponentTick.bStartWithTickEnabled = true;

    CurrentPhoneState = EPhoneDeviceState::Pocketed;
    CurrentRenderingMode = EPhoneRenderingMode::ViewportOverlay2D;
    ScreenResolution = FIntPoint(1080, 2400);
    SlideAnimationDuration = 0.28f;
    SlideAnimAlpha = 0.0f;
    bIsAnimatingSlide = false;
    bTargetSlideOpen = false;
}

void USmartphoneManagerComponent::BeginPlay()
{
    Super::BeginPlay();

    InitializeScreenWidgetAndRenderTarget();
}

void USmartphoneManagerComponent::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    if (ScreenWidgetInstance)
    {
        ScreenWidgetInstance->RemoveFromParent();
        ScreenWidgetInstance = nullptr;
    }

    ScreenRenderTarget = nullptr;
    PhoneScreenMID = nullptr;

    Super::EndPlay(EndPlayReason);
}

void USmartphoneManagerComponent::InitializeScreenWidgetAndRenderTarget()
{
    // 1. Create Render Target for 3D In-World Mesh Screen
    if (!ScreenRenderTarget)
    {
        ScreenRenderTarget = NewObject<UTextureRenderTarget2D>(this, TEXT("SmartphoneScreenRT"));
        if (ScreenRenderTarget)
        {
            ScreenRenderTarget->InitCustomFormat(ScreenResolution.X, ScreenResolution.Y, PF_B8G8R8A8, false);
            ScreenRenderTarget->ClearColor = FLinearColor::Black;
            ScreenRenderTarget->UpdateResourceImmediate(true);
        }
    }

    // 2. Create Screen Widget Instance
    UClass* WidgetClassToUse = ScreenWidgetClass ? ScreenWidgetClass.Get() : USmartphoneScreenWidget::StaticClass();
    if (APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0))
    {
        ScreenWidgetInstance = CreateWidget<USmartphoneScreenWidget>(PC, WidgetClassToUse);
        if (ScreenWidgetInstance)
        {
            ScreenWidgetInstance->SetManagerComponent(this);
            ScreenWidgetInstance->SetVisibility(ESlateVisibility::Collapsed);
        }
    }
}

void USmartphoneManagerComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (bIsAnimatingSlide)
    {
        AnimateSlideTransition(DeltaTime);
    }

    // If 3D mesh phone active, perform continuous camera raycasting
    if (CurrentPhoneState == EPhoneDeviceState::Active3DMeshInHand)
    {
        FVector2D HitUV;
        FHitResult HitResult;
        if (RaycastCameraToPhoneScreen(HitUV, HitResult))
        {
            LastTouchUV = HitUV;
        }
    }
}

void USmartphoneManagerComponent::TogglePhone()
{
    if (CurrentPhoneState == EPhoneDeviceState::Pocketed)
    {
        OpenPhone(DefaultRenderingMode);
    }
    else
    {
        ClosePhone();
    }
}

void USmartphoneManagerComponent::OpenPhone(EPhoneRenderingMode Mode)
{
    CurrentRenderingMode = Mode;

    if (!ScreenWidgetInstance)
    {
        InitializeScreenWidgetAndRenderTarget();
    }

    if (Mode == EPhoneRenderingMode::ViewportOverlay2D)
    {
        if (ScreenWidgetInstance && !ScreenWidgetInstance->IsInViewport())
        {
            ScreenWidgetInstance->AddToViewport(50); // High Z-order
        }

        if (ScreenWidgetInstance)
        {
            ScreenWidgetInstance->SetVisibility(ESlateVisibility::Visible);
        }

        bTargetSlideOpen = true;
        bIsAnimatingSlide = true;
        CurrentPhoneState = EPhoneDeviceState::Equipping;

        UpdateInputModeForState(true);
    }
    else // Mode == EPhoneRenderingMode::Diegetic3DMesh
    {
        CurrentPhoneState = EPhoneDeviceState::Active3DMeshInHand;
        if (ScreenWidgetInstance)
        {
            ScreenWidgetInstance->SetVisibility(ESlateVisibility::Visible);
        }
        UpdateInputModeForState(false);
    }

    PlayPhoneHaptic(TEXT("PhoneOpenSlide"));

    OnPhoneStateChanged.Broadcast(CurrentPhoneState);
    OnRenderingModeChanged.Broadcast(CurrentRenderingMode);
}

void USmartphoneManagerComponent::ClosePhone()
{
    if (CurrentRenderingMode == EPhoneRenderingMode::ViewportOverlay2D)
    {
        bTargetSlideOpen = false;
        bIsAnimatingSlide = true;
        CurrentPhoneState = EPhoneDeviceState::Unequipping;
    }
    else
    {
        CurrentPhoneState = EPhoneDeviceState::Pocketed;
        if (ScreenWidgetInstance)
        {
            ScreenWidgetInstance->SetVisibility(ESlateVisibility::Collapsed);
        }
        UpdateInputModeForState(false);
    }

    PlayPhoneHaptic(TEXT("PhoneCloseSlide"));
    OnPhoneStateChanged.Broadcast(CurrentPhoneState);
}

void USmartphoneManagerComponent::LaunchApp(EPhoneAppID AppID, const FString& LaunchParams)
{
    if (ScreenWidgetInstance)
    {
        ScreenWidgetInstance->LaunchApp(AppID, LaunchParams);
    }
}

void USmartphoneManagerComponent::NavigateToHomeScreen()
{
    if (ScreenWidgetInstance)
    {
        ScreenWidgetInstance->NavigateToHomeScreen();
    }
}

void USmartphoneManagerComponent::PlayPhoneHaptic(const FString& Pattern)
{
    if (APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0))
    {
        // Trigger small rumble / vibration
        PC->PlayDynamicForceFeedback(0.4f, 0.08f, true, true, true, true);
    }
}

void USmartphoneManagerComponent::Setup3DMeshScreenMaterial(UPrimitiveComponent* PhoneMeshComponent, int32 MaterialIndex, FName TextureParameterName)
{
    if (!PhoneMeshComponent) return;

    AttachedPhoneMeshComp = PhoneMeshComponent;

    if (!PhoneScreenMID)
    {
        UMaterialInterface* BaseMat = PhoneMeshComponent->GetMaterial(MaterialIndex);
        if (BaseMat)
        {
            PhoneScreenMID = PhoneMeshComponent->CreateDynamicMaterialInstance(MaterialIndex, BaseMat);
        }
    }

    if (PhoneScreenMID && ScreenRenderTarget)
    {
        PhoneScreenMID->SetTextureParameterValue(TextureParameterName, ScreenRenderTarget);
    }
}

bool USmartphoneManagerComponent::RaycastCameraToPhoneScreen(FVector2D& OutScreenUV, FHitResult& OutHitResult) const
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (!PC || !PC->PlayerCameraManager) return false;

    const FVector CamLoc = PC->PlayerCameraManager->GetCameraLocation();
    const FVector CamFwd = PC->PlayerCameraManager->GetCameraRotation().Vector();
    const FVector TraceEnd = CamLoc + (CamFwd * 300.0f); // 3-meter reach

    FCollisionQueryParams Params(TEXT("PhoneScreenTrace"), true, GetOwner());
    Params.bReturnFaceIndex = true;

    UWorld* World = GetWorld();
    if (!World) return false;

    if (World->LineTraceSingleByChannel(OutHitResult, CamLoc, TraceEnd, ECC_Visibility, Params))
    {
        if (AttachedPhoneMeshComp.IsValid() && OutHitResult.GetComponent() == AttachedPhoneMeshComp.Get())
        {
            // Find collision UV coordinates on hit face
            FVector2D HitUV;
            if (UGameplayStatics::FindCollisionUV(OutHitResult, 0, HitUV))
            {
                OutScreenUV = HitUV;
                return true;
            }
        }
    }

    return false;
}

void USmartphoneManagerComponent::Process3DScreenTouch(const FVector2D& TouchUV, bool bIsDown)
{
    if (!ScreenWidgetInstance || !ScreenWidgetInstance->GetCachedWidget().IsValid()) return;

    const float PixelX = TouchUV.X * ScreenResolution.X;
    const float PixelY = TouchUV.Y * ScreenResolution.Y;
    const FVector2D PixelPos(PixelX, PixelY);

    TSharedPtr<SWidget> SlateWidget = ScreenWidgetInstance->GetCachedWidget();
    if (!SlateWidget.IsValid()) return;

    if (bIsDown && !bIsTouching3DScreen)
    {
        bIsTouching3DScreen = true;
        FPointerEvent PointerDown(
            0,
            0,
            PixelPos,
            LastTouchUV * FVector2D(ScreenResolution),
            TSet<FKey>(),
            EKeys::LeftMouseButton,
            0.0f,
            FModifierKeysState()
        );
        FSlateApplication::Get().ProcessMouseButtonDownEvent(SlateWidget, PointerDown);
    }
    else if (!bIsDown && bIsTouching3DScreen)
    {
        bIsTouching3DScreen = false;
        FPointerEvent PointerUp(
            0,
            0,
            PixelPos,
            LastTouchUV * FVector2D(ScreenResolution),
            TSet<FKey>(),
            EKeys::LeftMouseButton,
            0.0f,
            FModifierKeysState()
        );
        FSlateApplication::Get().ProcessMouseButtonUpEvent(PointerUp);
    }
    else
    {
        FPointerEvent PointerMove(
            0,
            0,
            PixelPos,
            LastTouchUV * FVector2D(ScreenResolution),
            TSet<FKey>(),
            FModifierKeysState()
        );
        FSlateApplication::Get().ProcessMouseMoveEvent(PointerMove);
    }

    LastTouchUV = TouchUV;
}

void USmartphoneManagerComponent::UpdateInputModeForState(bool bUIActive)
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (!PC) return;

    if (bUIActive)
    {
        FInputModeGameAndUI InputMode;
        if (ScreenWidgetInstance && ScreenWidgetInstance->GetCachedWidget().IsValid())
        {
            InputMode.SetWidgetToFocus(ScreenWidgetInstance->GetCachedWidget());
        }
        InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
        InputMode.SetHideCursorDuringCapture(false);
        PC->SetInputMode(InputMode);
        PC->bShowMouseCursor = true;
    }
    else
    {
        FInputModeGameOnly InputMode;
        PC->SetInputMode(InputMode);
        PC->bShowMouseCursor = false;
    }
}

void USmartphoneManagerComponent::AnimateSlideTransition(float DeltaTime)
{
    const float Step = DeltaTime / FMath::Max(0.01f, SlideAnimationDuration);

    if (bTargetSlideOpen)
    {
        SlideAnimAlpha = FMath::Min(1.0f, SlideAnimAlpha + Step);
        if (SlideAnimAlpha >= 1.0f)
        {
            bIsAnimatingSlide = false;
            CurrentPhoneState = EPhoneDeviceState::Active2DOverlay;
            OnPhoneStateChanged.Broadcast(CurrentPhoneState);
        }
    }
    else
    {
        SlideAnimAlpha = FMath::Max(0.0f, SlideAnimAlpha - Step);
        if (SlideAnimAlpha <= 0.0f)
        {
            bIsAnimatingSlide = false;
            CurrentPhoneState = EPhoneDeviceState::Pocketed;
            if (ScreenWidgetInstance)
            {
                ScreenWidgetInstance->SetVisibility(ESlateVisibility::Collapsed);
            }
            UpdateInputModeForState(false);
            OnPhoneStateChanged.Broadcast(CurrentPhoneState);
        }
    }

    // Apply cubic-ease-out curve to translation
    const float SmoothAlpha = FMath::InterpEaseOut(0.0f, 1.0f, SlideAnimAlpha, 2.5f);
    if (ScreenWidgetInstance)
    {
        // 0.0 -> translated off-screen down by (1.0 - SmoothAlpha) * ScreenResolution.Y
        const float OffsetY = (1.0f - SmoothAlpha) * ScreenResolution.Y;
        ScreenWidgetInstance->SetRenderTranslation(FVector2D(0.0f, OffsetY));
        ScreenWidgetInstance->SetRenderOpacity(SmoothAlpha);
    }
}
