// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Widgets/SCompoundWidget.h"
#include "Widgets/DeclarativeSyntaxSupport.h"
#include "Input/Reply.h"

class SEditableTextBox;
class STextBlock;
class SButton;
class SImage;
class SProgressBar;
class SWebBrowser;
class SWidgetSwitcher;
class SHorizontalBox;
class SVerticalBox;
class SBorder;
class SScrollBox;

DECLARE_DELEGATE_OneParam(FOnEyefindUrlNavigated, const FString& /* NewURL */);
DECLARE_DELEGATE_TwoParams(FOnEyefindTitleChanged, const FString& /* TabID */, const FString& /* NewTitle */);
DECLARE_DELEGATE_OneParam(FOnEyefindZoomChanged, float /* NewZoomLevel */);

/**
 * Representation of a single bookmark entry in the Eyefind browser.
 */
struct FEyefindBookmarkItem
{
    FString Title;
    FString URL;
    FString IconGlyph;
    FLinearColor AccentColor;
    FString Category;
};

/**
 * Individual browser tab state.
 */
struct FEyefindBrowserTab
{
    FString TabID;
    FString TabTitle;
    FString CurrentURL;
    TArray<FString> HistoryStack;
    int32 HistoryIndex = -1;
    float ZoomLevel = 1.0f;
    bool bIsLoading = false;
    float LoadingProgress = 0.0f;
    TSharedPtr<SWebBrowser> WebBrowserInstance;
};

/**
 * AAA In-Game Slate Browser with Gamepad Virtual Thumbstick Cursor Emulation,
 * Embedded SWebBrowser, Multi-Tab Management, Bookmark Drawer, and Zoom Engine.
 */
class GTA6CORE_API SEyefindBrowserWidget : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SEyefindBrowserWidget)
        : _InitialURL(TEXT("https://www.eyefind.info"))
        , _bEnableGamepadThumbstickCursor(true)
        , _DefaultZoomLevel(1.0f)
        , _MaxTabs(8)
    {}
        SLATE_ARGUMENT(FString, InitialURL)
        SLATE_ARGUMENT(bool, bEnableGamepadThumbstickCursor)
        SLATE_ARGUMENT(float, DefaultZoomLevel)
        SLATE_ARGUMENT(int32, MaxTabs)
        SLATE_EVENT(FOnEyefindUrlNavigated, OnUrlNavigated)
        SLATE_EVENT(FOnEyefindTitleChanged, OnTitleChanged)
        SLATE_EVENT(FOnEyefindZoomChanged, OnZoomChanged)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);

    // Browser Navigation
    void NavigateToURL(const FString& InURL);
    void NavigateBack();
    void NavigateForward();
    void RefreshPage();
    void StopLoading();

    // Tab Management
    void CreateNewTab(const FString& InURL = TEXT("https://www.eyefind.info"));
    void CloseTab(int32 TabIndex);
    void SwitchToTab(int32 TabIndex);
    int32 GetActiveTabIndex() const { return ActiveTabIndex; }
    int32 GetTabCount() const { return OpenTabs.Num(); }

    // Bookmark Drawer
    void ToggleBookmarkDrawer();
    void AddCurrentPageToBookmarks();
    void RemoveBookmark(const FString& InURL);

    // Zoom Engine
    void ZoomIn();
    void ZoomOut();
    void ResetZoom();
    float GetCurrentZoomLevel() const;

    // Virtual Gamepad Cursor & Slate Input Events
    virtual void Tick(const FGeometry& AllottedGeometry, const double InCurrentTime, const float InDeltaTime) override;
    virtual int32 OnPaint(const FPaintArgs& Args, const FGeometry& AllottedGeometry, const FSlateRect& MyCullingRect, FSlateWindowElementList& OutDrawElements, int32 LayerId, const FWidgetStyle& InWidgetStyle, bool bParentEnabled) const override;
    virtual FReply OnAnalogValueChanged(const FGeometry& MyGeometry, const FAnalogInputEvent& InAnalogInputEvent) override;
    virtual FReply OnKeyDown(const FGeometry& MyGeometry, const FKeyEvent& InKeyEvent) override;
    virtual FReply OnKeyUp(const FGeometry& MyGeometry, const FKeyEvent& InKeyEvent) override;
    virtual FReply OnMouseMove(const FGeometry& MyGeometry, const FPointerEvent& MouseEvent) override;
    virtual FReply OnMouseButtonDown(const FGeometry& MyGeometry, const FPointerEvent& MouseEvent) override;
    virtual FReply OnMouseButtonUp(const FGeometry& MyGeometry, const FPointerEvent& MouseEvent) override;
    virtual FReply OnMouseWheel(const FGeometry& MyGeometry, const FPointerEvent& MouseEvent) override;

    // Cursor Accessors
    FVector2D GetVirtualCursorPosition() const { return VirtualCursorPos; }
    void SetVirtualCursorPosition(const FVector2D& InPos) { VirtualCursorPos = InPos; }
    bool IsGamepadCursorEnabled() const { return bGamepadCursorEnabled; }
    void SetGamepadCursorEnabled(bool bEnabled) { bGamepadCursorEnabled = bEnabled; }

private:
    // Tab Management State
    TArray<FEyefindBrowserTab> OpenTabs;
    int32 ActiveTabIndex = 0;
    int32 MaxAllowedTabs = 8;

    // Bookmark State
    TArray<FEyefindBookmarkItem> Bookmarks;
    bool bBookmarkDrawerOpen = false;

    // UI Widgets Hierarchy
    TSharedPtr<SEditableTextBox> AddressBarTextBox;
    TSharedPtr<STextBlock> PageTitleTextBlock;
    TSharedPtr<STextBlock> StatusBarTextBlock;
    TSharedPtr<STextBlock> SecurityBadgeTextBlock;
    TSharedPtr<STextBlock> ZoomLevelTextBlock;
    TSharedPtr<SProgressBar> LoadingProgressBar;
    TSharedPtr<SHorizontalBox> TabBarBox;
    TSharedPtr<SBorder> BookmarkDrawerBorder;
    TSharedPtr<SScrollBox> BookmarkScrollBox;
    TSharedPtr<SWidgetSwitcher> BrowserTabSwitcher;

    // Gamepad Virtual Mouse Cursor State
    bool bGamepadCursorEnabled = true;
    bool bIsCursorHoveringInteractive = false;
    bool bIsLeftMouseButtonDown = false;
    FVector2D VirtualCursorPos = FVector2D(640.0f, 360.0f);
    FVector2D CursorVelocity = FVector2D::ZeroVector;
    FVector2D ThumbstickInput = FVector2D::ZeroVector;
    FVector2D RightStickScrollInput = FVector2D::ZeroVector;

    float CursorSpeed = 950.0f;
    float CursorAcceleration = 2200.0f;
    float CursorFriction = 8.0f;
    float StickDeadzone = 0.15f;
    float ClickRippleAnimTimer = 0.0f;
    FVector2D LastClickPos = FVector2D::ZeroVector;

    // Event Delegates
    FOnEyefindUrlNavigated OnUrlNavigatedDelegate;
    FOnEyefindTitleChanged OnTitleChangedDelegate;
    FOnEyefindZoomChanged OnZoomChangedDelegate;

    // Helper Builder Functions
    void RebuildTabBar();
    void RebuildBookmarkDrawer();
    void PopulateDefaultBookmarks();
    void ApplyZoomToActiveTab();

    // SWebBrowser Event Handlers
    void HandleBrowserUrlChanged(const FText& InURL);
    void HandleBrowserTitleChanged(const FText& InTitle);
    void HandleBrowserLoadCompleted();
    void HandleBrowserLoadError();

    // Button & Input Callbacks
    FReply HandleSearchCommitted(const FText& Text, ETextCommit::Type CommitMethod);
    FReply HandleGoButtonClicked();
    FReply HandleQuickTabClicked(FString TargetURL);
    FReply HandleBackClicked();
    FReply HandleForwardClicked();
    FReply HandleRefreshClicked();
    FReply HandleStopClicked();
    FReply HandleBookmarkToggleClicked();
    FReply HandleAddBookmarkClicked();
    FReply HandleZoomInClicked();
    FReply HandleZoomOutClicked();
    FReply HandleResetZoomClicked();
    FReply HandleNewTabClicked();
    FReply HandleCloseTabClicked(int32 TabIndexToClose);
    FReply HandleTabSelectClicked(int32 TabIndexToSelect);
};
