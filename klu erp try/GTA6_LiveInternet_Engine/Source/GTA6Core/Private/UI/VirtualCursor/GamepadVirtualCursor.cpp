// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "UI/VirtualCursor/GamepadVirtualCursor.h"
#include "Framework/Application/SlateApplication.h"
#include "Containers/Ticker.h"
#include "Engine/Engine.h"
#include "Widgets/SWindow.h"

void UGamepadVirtualCursorSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    // Register high-precision game tick for cursor simulation
    TickerHandle = FTSTicker::GetCoreTicker().AddTicker(
        FTickerDelegate::CreateUObject(this, &UGamepadVirtualCursorSubsystem::OnEngineTick)
    );

    UE_LOG(LogTemp, Log, TEXT("[GamepadVirtualCursor] Subsystem initialized."));
}

void UGamepadVirtualCursorSubsystem::Deinitialize()
{
    if (TickerHandle.IsValid())
    {
        FTSTicker::GetCoreTicker().RemoveTicker(TickerHandle);
        TickerHandle.Reset();
    }

    Super::Deinitialize();
}

bool UGamepadVirtualCursorSubsystem::OnEngineTick(float DeltaTime)
{
    if (bCursorEnabled)
    {
        TickVirtualCursor(DeltaTime);
    }
    return true;
}

void UGamepadVirtualCursorSubsystem::SetVirtualCursorEnabled(bool bEnabled)
{
    if (bCursorEnabled == bEnabled) return;
    bCursorEnabled = bEnabled;

    if (FSlateApplication::IsInitialized())
    {
        if (bCursorEnabled)
        {
            // Sync virtual cursor position with current physical mouse cursor
            CurrentCursorPosition = FSlateApplication::Get().GetCursorPos();
            CurrentVelocity = FVector2D::ZeroVector;
        }
    }
}

void UGamepadVirtualCursorSubsystem::SetCursorConstraintBox(const FBox2D& InConstraintBox, bool bConstrain)
{
    ConstraintBox = InConstraintBox;
    bIsConstrained = bConstrain;

    if (bIsConstrained && ConstraintBox.bIsValid)
    {
        CurrentCursorPosition.X = FMath::Clamp(CurrentCursorPosition.X, ConstraintBox.Min.X, ConstraintBox.Max.X);
        CurrentCursorPosition.Y = FMath::Clamp(CurrentCursorPosition.Y, ConstraintBox.Min.Y, ConstraintBox.Max.Y);
    }
}

void UGamepadVirtualCursorSubsystem::ClearCursorConstraint()
{
    bIsConstrained = false;
    ConstraintBox.Init();
}

void UGamepadVirtualCursorSubsystem::SetCursorPosition(const FVector2D& InNewPosition)
{
    const FVector2D OldPos = CurrentCursorPosition;
    CurrentCursorPosition = InNewPosition;

    if (bIsConstrained && ConstraintBox.bIsValid)
    {
        CurrentCursorPosition.X = FMath::Clamp(CurrentCursorPosition.X, ConstraintBox.Min.X, ConstraintBox.Max.X);
        CurrentCursorPosition.Y = FMath::Clamp(CurrentCursorPosition.Y, ConstraintBox.Min.Y, ConstraintBox.Max.Y);
    }

    DispatchSyntheticMouseMove(OldPos, CurrentCursorPosition);
}

void UGamepadVirtualCursorSubsystem::UpdateAnalogInput(const FVector2D& InLeftStickInput, const FVector2D& InRightStickScroll)
{
    LeftStickRawInput = InLeftStickInput;
    RightStickScrollRaw = InRightStickScroll;
}

FVector2D UGamepadVirtualCursorSubsystem::ApplyAnalogCurve(const FVector2D& RawStick) const
{
    const float Magnitude = RawStick.Size();
    if (Magnitude <= Config.DeadZone)
    {
        return FVector2D::ZeroVector;
    }

    // Remap (DeadZone -> 1.0) to (0.0 -> 1.0)
    const float RemappedMagnitude = (Magnitude - Config.DeadZone) / (1.0f - Config.DeadZone);
    const float CurvedMagnitude = FMath::Pow(FMath::Clamp(RemappedMagnitude, 0.0f, 1.0f), Config.ResponseCurveExponent);

    const FVector2D Direction = RawStick / Magnitude;
    return Direction * CurvedMagnitude;
}

FVector2D UGamepadVirtualCursorSubsystem::CalculateMagneticPull(const FVector2D& InPos) const
{
    if (!Config.bEnableMagneticSnapping || !FSlateApplication::IsInitialized())
    {
        return FVector2D::ZeroVector;
    }

    // Trace interactive widgets in slate hierarchy near cursor
    FWidgetPath WidgetPath = FSlateApplication::Get().LocateWindowUnderMouse(InPos, FSlateApplication::Get().GetInteractiveTopLevelWindows());
    if (WidgetPath.IsValid() && WidgetPath.Widgets.Num() > 0)
    {
        const FArrangedWidget& LeafWidget = WidgetPath.Widgets.Last();
        if (LeafWidget.Widget->IsEnabled())
        {
            const FGeometry& WidgetGeom = LeafWidget.Geometry;
            const FVector2D WidgetCenter = WidgetGeom.GetAbsolutePosition() + (WidgetGeom.GetAbsoluteSize() * 0.5f);
            const FVector2D Delta = WidgetCenter - InPos;
            const float Dist = Delta.Size();

            if (Dist > 0.1f && Dist < Config.MagneticPullRadius)
            {
                const float Falloff = 1.0f - (Dist / Config.MagneticPullRadius);
                return Delta.GetSafeNormal() * (Falloff * Config.MagneticPullStrength * Config.MaxSpeed * 0.5f);
            }
        }
    }

    return FVector2D::ZeroVector;
}

void UGamepadVirtualCursorSubsystem::TickVirtualCursor(float DeltaTime)
{
    if (!FSlateApplication::IsInitialized() || DeltaTime <= 0.0f) return;

    const FVector2D ProcessedStick = ApplyAnalogCurve(LeftStickRawInput);
    const FVector2D MagneticPull = CalculateMagneticPull(CurrentCursorPosition);

    // Target Velocity
    const FVector2D TargetVelocity = (ProcessedStick * Config.MaxSpeed) + MagneticPull;

    if (!TargetVelocity.IsNearlyZero())
    {
        CurrentVelocity = FMath::Vector2DInterpTo(CurrentVelocity, TargetVelocity, DeltaTime, Config.Acceleration / Config.MaxSpeed);
    }
    else
    {
        CurrentVelocity = FMath::Vector2DInterpTo(CurrentVelocity, FVector2D::ZeroVector, DeltaTime, Config.Friction);
    }

    if (!CurrentVelocity.IsNearlyZero(0.1f))
    {
        const FVector2D OldPos = CurrentCursorPosition;
        CurrentCursorPosition += CurrentVelocity * DeltaTime;

        // Clamp to screen / window bounds or custom constraint box
        if (bIsConstrained && ConstraintBox.bIsValid)
        {
            CurrentCursorPosition.X = FMath::Clamp(CurrentCursorPosition.X, ConstraintBox.Min.X, ConstraintBox.Max.X);
            CurrentCursorPosition.Y = FMath::Clamp(CurrentCursorPosition.Y, ConstraintBox.Min.Y, ConstraintBox.Max.Y);
        }
        else
        {
            TSharedPtr<SWindow> ActiveWindow = FSlateApplication::Get().GetActiveTopLevelWindow();
            if (ActiveWindow.IsValid())
            {
                const FVector2D WindowSize = ActiveWindow->GetSizeInScreen();
                const FVector2D WindowPos = ActiveWindow->GetPositionInScreen();
                CurrentCursorPosition.X = FMath::Clamp(CurrentCursorPosition.X, WindowPos.X, WindowPos.X + WindowSize.X);
                CurrentCursorPosition.Y = FMath::Clamp(CurrentCursorPosition.Y, WindowPos.Y, WindowPos.Y + WindowSize.Y);
            }
        }

        DispatchSyntheticMouseMove(OldPos, CurrentCursorPosition);
        UpdateCursorVisualUnderPosition(CurrentCursorPosition);
    }

    // Handle Right Stick Scroll
    if (!RightStickScrollRaw.IsNearlyZero(Config.DeadZone))
    {
        const float ScrollAmount = RightStickScrollRaw.Y * Config.ScrollMultiplier * DeltaTime;
        DispatchSyntheticMouseScroll(CurrentCursorPosition, ScrollAmount);
    }
}

void UGamepadVirtualCursorSubsystem::DispatchSyntheticMouseMove(const FVector2D& OldPos, const FVector2D& NewPos)
{
    if (!FSlateApplication::IsInitialized()) return;

    TSet<FKey> PressedButtons;
    if (bLeftButtonDown) PressedButtons.Add(EKeys::LeftMouseButton);
    if (bRightButtonDown) PressedButtons.Add(EKeys::RightMouseButton);

    const FPointerEvent MouseMoveEvent(
        0,
        NewPos,
        OldPos,
        PressedButtons,
        EKeys::Invalid,
        0.0f,
        FModifierKeysState()
    );

    FSlateApplication::Get().ProcessMouseMoveEvent(MouseMoveEvent);
    OnCursorMoved.Broadcast(NewPos, NewPos - OldPos);
}

void UGamepadVirtualCursorSubsystem::DispatchSyntheticMouseButton(const FVector2D& Pos, FKey ButtonKey, bool bDown)
{
    if (!FSlateApplication::IsInitialized()) return;

    TSet<FKey> PressedButtons;
    if (ButtonKey == EKeys::LeftMouseButton)
    {
        bLeftButtonDown = bDown;
    }
    else if (ButtonKey == EKeys::RightMouseButton)
    {
        bRightButtonDown = bDown;
    }

    if (bLeftButtonDown) PressedButtons.Add(EKeys::LeftMouseButton);
    if (bRightButtonDown) PressedButtons.Add(EKeys::RightMouseButton);

    const FPointerEvent MouseEvent(
        0,
        Pos,
        Pos,
        PressedButtons,
        ButtonKey,
        0.0f,
        FModifierKeysState()
    );

    if (bDown)
    {
        TSharedPtr<SWindow> WindowUnderCursor = FSlateApplication::Get().LocateWindowUnderMouse(Pos, FSlateApplication::Get().GetInteractiveTopLevelWindows()).GetWindow();
        FSlateApplication::Get().ProcessMouseButtonDownEvent(WindowUnderCursor, MouseEvent);
    }
    else
    {
        FSlateApplication::Get().ProcessMouseButtonUpEvent(MouseEvent);
    }

    OnCursorClicked.Broadcast(Pos, bDown);
}

void UGamepadVirtualCursorSubsystem::DispatchSyntheticMouseScroll(const FVector2D& Pos, float ScrollDelta)
{
    if (!FSlateApplication::IsInitialized() || FMath::IsNearlyZero(ScrollDelta)) return;

    const FPointerEvent ScrollEvent(
        0,
        Pos,
        Pos,
        TSet<FKey>(),
        EKeys::MouseWheelAxis,
        ScrollDelta,
        FModifierKeysState()
    );

    FSlateApplication::Get().ProcessMouseWheelEvent(ScrollEvent);
}

void UGamepadVirtualCursorSubsystem::ProcessVirtualMouseButton(FKey ButtonKey, bool bIsPressed)
{
    DispatchSyntheticMouseButton(CurrentCursorPosition, ButtonKey, bIsPressed);
}

void UGamepadVirtualCursorSubsystem::UpdateCursorVisualUnderPosition(const FVector2D& ScreenPos)
{
    if (!FSlateApplication::IsInitialized()) return;

    EVirtualCursorVisualType NewVisual = EVirtualCursorVisualType::DefaultArrow;
    FWidgetPath WidgetPath = FSlateApplication::Get().LocateWindowUnderMouse(ScreenPos, FSlateApplication::Get().GetInteractiveTopLevelWindows());

    if (WidgetPath.IsValid() && WidgetPath.Widgets.Num() > 0)
    {
        const FArrangedWidget& LeafWidget = WidgetPath.Widgets.Last();
        const FName WidgetType = LeafWidget.Widget->GetType();

        if (WidgetType == "SButton" || WidgetType == "SHyperlink" || WidgetType == "SCheckBox")
        {
            NewVisual = EVirtualCursorVisualType::HandHover;
        }
        else if (WidgetType == "SEditableTextBox" || WidgetType == "SEditableText" || WidgetType == "SMultiLineEditableTextBox")
        {
            NewVisual = EVirtualCursorVisualType::TextIBeam;
        }
        else if (WidgetType == "SScrollBar" || WidgetType == "SSlider")
        {
            NewVisual = EVirtualCursorVisualType::Grab;
        }
    }

    if (NewVisual != CurrentVisualType)
    {
        CurrentVisualType = NewVisual;
        OnCursorVisualChanged.Broadcast(CurrentVisualType);
    }
}
