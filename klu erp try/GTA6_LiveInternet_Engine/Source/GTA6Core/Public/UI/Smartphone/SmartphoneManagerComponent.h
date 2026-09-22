// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "UI/Smartphone/PhoneAppBase.h"
#include "UI/Smartphone/SmartphoneScreenWidget.h"
#include "Engine/TextureRenderTarget2D.h"
#include "SmartphoneManagerComponent.generated.h"

class USmartphoneScreenWidget;
class UMaterialInstanceDynamic;

UENUM(BlueprintType)
enum class EPhoneDeviceState : uint8
{
    Pocketed,
    Equipping,
    Active2DOverlay,
    Active3DMeshInHand,
    RingingIncomingCall,
    Unequipping
};

UENUM(BlueprintType)
enum class EPhoneRenderingMode : uint8
{
    ViewportOverlay2D   UMETA(DisplayName = "2D HUD Viewport Overlay"),
    Diegetic3DMesh      UMETA(DisplayName = "3D Physical In-Hand Mesh")
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPhoneStateChanged, EPhoneDeviceState, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPhoneRenderingModeChanged, EPhoneRenderingMode, NewMode);

/**
 * AAA Smartphone Manager Component attached to player characters / controllers.
 * Coordinates dual rendering modes (2D HUD Viewport overlay vs 3D diegetic mesh screen with dynamic render targets),
 * Camera-to-UV touch raycast projection, input mode arbitration, and mobile application lifecycle.
 */
UCLASS(ClassGroup = (Smartphone), meta = (BlueprintSpawnableComponent))
class GTA6CORE_API USmartphoneManagerComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    USmartphoneManagerComponent();

    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    // Phone Lifecycle & State Control
    UFUNCTION(BlueprintCallable, Category = "Smartphone")
    void TogglePhone();

    UFUNCTION(BlueprintCallable, Category = "Smartphone")
    void OpenPhone(EPhoneRenderingMode Mode = EPhoneRenderingMode::ViewportOverlay2D);

    UFUNCTION(BlueprintCallable, Category = "Smartphone")
    void ClosePhone();

    UFUNCTION(BlueprintCallable, Category = "Smartphone")
    void LaunchApp(EPhoneAppID AppID, const FString& LaunchParams = TEXT(""));

    UFUNCTION(BlueprintCallable, Category = "Smartphone")
    void NavigateToHomeScreen();

    UFUNCTION(BlueprintCallable, Category = "Smartphone")
    void PlayPhoneHaptic(const FString& Pattern = TEXT("LightClick"));

    // 3D In-World Mesh Screen Touch Raycasting
    UFUNCTION(BlueprintCallable, Category = "Smartphone 3D Touch")
    bool RaycastCameraToPhoneScreen(FVector2D& OutScreenUV, FHitResult& OutHitResult) const;

    UFUNCTION(BlueprintCallable, Category = "Smartphone 3D Touch")
    void Process3DScreenTouch(const FVector2D& TouchUV, bool bIsDown);

    // Setup 3D In-World Mesh Target
    UFUNCTION(BlueprintCallable, Category = "Smartphone 3D Mesh")
    void Setup3DMeshScreenMaterial(UPrimitiveComponent* PhoneMeshComponent, int32 MaterialIndex = 0, FName TextureParameterName = TEXT("ScreenTexture"));

    // Accessors
    UFUNCTION(BlueprintPure, Category = "Smartphone")
    EPhoneDeviceState GetPhoneState() const { return CurrentPhoneState; }

    UFUNCTION(BlueprintPure, Category = "Smartphone")
    EPhoneRenderingMode GetRenderingMode() const { return CurrentRenderingMode; }

    UFUNCTION(BlueprintPure, Category = "Smartphone")
    USmartphoneScreenWidget* GetScreenWidget() const { return ScreenWidgetInstance; }

    UFUNCTION(BlueprintPure, Category = "Smartphone")
    UTextureRenderTarget2D* GetScreenRenderTarget() const { return ScreenRenderTarget; }

    // Configuration
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Smartphone|Config")
    TSubclassOf<USmartphoneScreenWidget> ScreenWidgetClass;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Smartphone|Config")
    FIntPoint ScreenResolution = FIntPoint(1080, 2400);

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Smartphone|Config")
    EPhoneRenderingMode DefaultRenderingMode = EPhoneRenderingMode::ViewportOverlay2D;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Smartphone|Config")
    float SlideAnimationDuration = 0.28f;

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Smartphone|Events")
    FOnPhoneStateChanged OnPhoneStateChanged;

    UPROPERTY(BlueprintAssignable, Category = "Smartphone|Events")
    FOnPhoneRenderingModeChanged OnRenderingModeChanged;

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|State")
    EPhoneDeviceState CurrentPhoneState = EPhoneDeviceState::Pocketed;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|State")
    EPhoneRenderingMode CurrentRenderingMode = EPhoneRenderingMode::ViewportOverlay2D;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|State")
    TObjectPtr<USmartphoneScreenWidget> ScreenWidgetInstance;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|State")
    TObjectPtr<UTextureRenderTarget2D> ScreenRenderTarget;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|State")
    TObjectPtr<UMaterialInstanceDynamic> PhoneScreenMID;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|State")
    TWeakObjectPtr<UPrimitiveComponent> AttachedPhoneMeshComp;

    // Slide-in Animation State
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|Animation")
    float SlideAnimAlpha = 0.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|Animation")
    bool bIsAnimatingSlide = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Smartphone|Animation")
    bool bTargetSlideOpen = false;

    // 3D Raycast Touch State
    FVector2D LastTouchUV = FVector2D::ZeroVector;
    bool bIsTouching3DScreen = false;

private:
    void InitializeScreenWidgetAndRenderTarget();
    void UpdateInputModeForState(bool bUIActive);
    void AnimateSlideTransition(float DeltaTime);
};
