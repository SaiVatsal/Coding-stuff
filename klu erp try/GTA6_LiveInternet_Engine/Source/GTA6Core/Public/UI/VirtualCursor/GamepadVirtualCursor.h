// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "InputCoreTypes.h"
#include "Framework/Application/SlateApplication.h"
#include "GamepadVirtualCursor.generated.h"

UENUM(BlueprintType)
enum class EVirtualCursorVisualType : uint8
{
    DefaultArrow       UMETA(DisplayName = "Default Arrow Pointer"),
    HandHover          UMETA(DisplayName = "Hand / Link Hover"),
    TextIBeam          UMETA(DisplayName = "Text Caret / I-Beam"),
    Grab               UMETA(DisplayName = "Grab / Pan"),
    LoadingSpinner     UMETA(DisplayName = "Loading Spinner")
};

USTRUCT(BlueprintType)
struct FVirtualCursorConfig
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    float MaxSpeed = 1600.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    float Acceleration = 3800.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    float Friction = 10.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    float DeadZone = 0.15f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    float ResponseCurveExponent = 1.8f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    bool bEnableMagneticSnapping = true;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    float MagneticPullRadius = 45.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    float MagneticPullStrength = 0.45f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor")
    float ScrollMultiplier = 800.0f;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnVirtualCursorMoved, const FVector2D&, NewPosition, const FVector2D&, DeltaMovement);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnVirtualCursorClicked, const FVector2D&, ClickPosition, bool, bIsDown);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnVirtualCursorVisualChanged, EVirtualCursorVisualType, NewVisual);

/**
 * AAA Slate/C++ Gamepad Virtual Mouse Cursor Controller.
 * Bridges gamepad analog thumbsticks directly into Slate synthetic pointer events
 * with magnetic widget attraction, velocity damping, and multi-device handoff.
 */
UCLASS()
class GTA6CORE_API UGamepadVirtualCursorSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    /** Enable or disable the virtual cursor system */
    UFUNCTION(BlueprintCallable, Category = "Virtual Cursor")
    void SetVirtualCursorEnabled(bool bEnabled);

    /** Query enabled state */
    UFUNCTION(BlueprintPure, Category = "Virtual Cursor")
    bool IsVirtualCursorEnabled() const { return bCursorEnabled; }

    /** Lock cursor within specific bounding box (e.g., smartphone screen rectangle) */
    UFUNCTION(BlueprintCallable, Category = "Virtual Cursor")
    void SetCursorConstraintBox(const FBox2D& InConstraintBox, bool bConstrain = true);

    /** Clear cursor bounding constraint */
    UFUNCTION(BlueprintCallable, Category = "Virtual Cursor")
    void ClearCursorConstraint();

    /** Manually set virtual cursor position */
    UFUNCTION(BlueprintCallable, Category = "Virtual Cursor")
    void SetCursorPosition(const FVector2D& InNewPosition);

    /** Get current virtual cursor position */
    UFUNCTION(BlueprintPure, Category = "Virtual Cursor")
    FVector2D GetCursorPosition() const { return CurrentCursorPosition; }

    /** Feed analog thumbstick input (Call from PlayerController or Input Component) */
    UFUNCTION(BlueprintCallable, Category = "Virtual Cursor")
    void UpdateAnalogInput(const FVector2D& InLeftStickInput, const FVector2D& InRightStickScroll);

    /** Process virtual mouse button action */
    UFUNCTION(BlueprintCallable, Category = "Virtual Cursor")
    void ProcessVirtualMouseButton(FKey ButtonKey, bool bIsPressed);

    /** Tick virtual cursor motion & physics simulation */
    void TickVirtualCursor(float DeltaTime);

    // Event Dispatchers
    UPROPERTY(BlueprintAssignable, Category = "Virtual Cursor|Events")
    FOnVirtualCursorMoved OnCursorMoved;

    UPROPERTY(BlueprintAssignable, Category = "Virtual Cursor|Events")
    FOnVirtualCursorClicked OnCursorClicked;

    UPROPERTY(BlueprintAssignable, Category = "Virtual Cursor|Events")
    FOnVirtualCursorVisualChanged OnCursorVisualChanged;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Virtual Cursor|Config")
    FVirtualCursorConfig Config;

private:
    bool bCursorEnabled = false;
    bool bIsConstrained = false;
    FBox2D ConstraintBox = FBox2D(ForceInit);

    FVector2D CurrentCursorPosition = FVector2D(960.0f, 540.0f);
    FVector2D CurrentVelocity = FVector2D::ZeroVector;
    FVector2D LeftStickRawInput = FVector2D::ZeroVector;
    FVector2D RightStickScrollRaw = FVector2D::ZeroVector;

    EVirtualCursorVisualType CurrentVisualType = EVirtualCursorVisualType::DefaultArrow;
    bool bLeftButtonDown = false;
    bool bRightButtonDown = false;

    FTSTicker::FDelegateHandle TickerHandle;

    bool OnEngineTick(float DeltaTime);
    void DispatchSyntheticMouseMove(const FVector2D& OldPos, const FVector2D& NewPos);
    void DispatchSyntheticMouseButton(const FVector2D& Pos, FKey ButtonKey, bool bDown);
    void DispatchSyntheticMouseScroll(const FVector2D& Pos, float ScrollDelta);

    FVector2D ApplyAnalogCurve(const FVector2D& RawStick) const;
    FVector2D CalculateMagneticPull(const FVector2D& InPos) const;
    void UpdateCursorVisualUnderPosition(const FVector2D& ScreenPos);
};
