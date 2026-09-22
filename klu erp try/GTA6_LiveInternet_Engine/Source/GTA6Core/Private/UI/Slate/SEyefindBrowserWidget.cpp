// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "UI/Slate/SEyefindBrowserWidget.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/Layout/SWidgetSwitcher.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Input/SEditableTextBox.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Notifications/SProgressBar.h"
#include "Widgets/Images/SImage.h"
#include "SWebBrowser.h"
#include "Styling/CoreStyle.h"
#include "Rendering/DrawElements.h"
#include "Framework/Application/SlateApplication.h"

void SEyefindBrowserWidget::Construct(const FArguments& InArgs)
{
    bGamepadCursorEnabled = InArgs._bEnableGamepadThumbstickCursor;
    MaxAllowedTabs = FMath::Clamp(InArgs._MaxTabs, 1, 16);
    OnUrlNavigatedDelegate = InArgs._OnUrlNavigated;
    OnTitleChangedDelegate = InArgs._OnTitleChanged;
    OnZoomChangedDelegate = InArgs._OnZoomChanged;

    PopulateDefaultBookmarks();

    // Create Initial Browser Tab
    FEyefindBrowserTab InitialTab;
    InitialTab.TabID = FGuid::NewGuid().ToString();
    InitialTab.TabTitle = TEXT("Eyefind Home");
    InitialTab.CurrentURL = InArgs._InitialURL.IsEmpty() ? TEXT("https://www.eyefind.info") : InArgs._InitialURL;
    InitialTab.HistoryStack.Add(InitialTab.CurrentURL);
    InitialTab.HistoryIndex = 0;
    InitialTab.ZoomLevel = InArgs._DefaultZoomLevel;
    InitialTab.bIsLoading = false;
    InitialTab.LoadingProgress = 1.0f;

    // Build SWebBrowser for this tab
    InitialTab.WebBrowserInstance = SNew(SWebBrowser)
        .InitialURL(InitialTab.CurrentURL)
        .ShowControls(false)
        .ShowAddressBar(false)
        .OnUrlChanged(FOnTextChanged::CreateRaw(this, &SEyefindBrowserWidget::HandleBrowserUrlChanged))
        .OnTitleChanged(FOnTextChanged::CreateRaw(this, &SEyefindBrowserWidget::HandleBrowserTitleChanged))
        .OnLoadCompleted(FSimpleDelegate::CreateRaw(this, &SEyefindBrowserWidget::HandleBrowserLoadCompleted))
        .OnLoadError(FSimpleDelegate::CreateRaw(this, &SEyefindBrowserWidget::HandleBrowserLoadError));

    OpenTabs.Add(InitialTab);
    ActiveTabIndex = 0;

    // Root Widget Composition
    ChildSlot
    [
        SNew(SBorder)
        .BorderBackgroundColor(FLinearColor(0.04f, 0.04f, 0.06f, 1.0f))
        .Padding(0.0f)
        [
            SNew(SVerticalBox)

            // 1. TOP TAB STRIP
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(4.0f, 2.0f, 4.0f, 0.0f)
            [
                SNew(SHorizontalBox)
                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                [
                    SAssignNew(TabBarBox, SHorizontalBox)
                ]
                + SHorizontalBox::Slot()
                .AutoWidth()
                .VAlign(VAlign_Center)
                .Padding(4.0f, 0.0f)
                [
                    SNew(SButton)
                    .ButtonStyle(FCoreStyle::Get(), "NoBorder")
                    .ContentPadding(FMargin(6.0f, 2.0f))
                    .OnClicked(this, &SEyefindBrowserWidget::HandleNewTabClicked)
                    [
                        SNew(STextBlock)
                        .Text(FText::FromString(TEXT("➕")))
                        .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
                        .ColorAndOpacity(FLinearColor(0.9f, 0.8f, 0.3f, 1.0f))
                    ]
                ]
            ]

            // 2. MAIN BROWSER CHROME & NAVIGATION BAR
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(6.0f, 4.0f)
            [
                SNew(SBorder)
                .BorderBackgroundColor(FLinearColor(0.09f, 0.09f, 0.12f, 1.0f))
                .Padding(FMargin(6.0f, 4.0f))
                [
                    SNew(SHorizontalBox)

                    // Back Button
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .Padding(2.0f, 0.0f)
                    [
                        SNew(SButton)
                        .ContentPadding(FMargin(8.0f, 4.0f))
                        .OnClicked(this, &SEyefindBrowserWidget::HandleBackClicked)
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(TEXT("◀")))
                            .ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f))
                        ]
                    ]

                    // Forward Button
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .Padding(2.0f, 0.0f)
                    [
                        SNew(SButton)
                        .ContentPadding(FMargin(8.0f, 4.0f))
                        .OnClicked(this, &SEyefindBrowserWidget::HandleForwardClicked)
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(TEXT("▶")))
                            .ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f))
                        ]
                    ]

                    // Reload / Stop Button
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .Padding(2.0f, 0.0f)
                    [
                        SNew(SButton)
                        .ContentPadding(FMargin(8.0f, 4.0f))
                        .OnClicked(this, &SEyefindBrowserWidget::HandleRefreshClicked)
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(TEXT("⟳")))
                            .ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f))
                        ]
                    ]

                    // SSL Security Lock Badge
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .VAlign(VAlign_Center)
                    .Padding(6.0f, 0.0f, 2.0f, 0.0f)
                    [
                        SAssignNew(SecurityBadgeTextBlock, STextBlock)
                        .Text(FText::FromString(TEXT("🔒")))
                        .Font(FCoreStyle::GetDefaultFontStyle("Regular", 11))
                        .ColorAndOpacity(FLinearColor(0.2f, 0.9f, 0.4f))
                    ]

                    // URL Address & Search Bar
                    + SHorizontalBox::Slot()
                    .FillWidth(1.0f)
                    .Padding(4.0f, 0.0f)
                    [
                        SAssignNew(AddressBarTextBox, SEditableTextBox)
                        .Text(FText::FromString(InitialTab.CurrentURL))
                        .Font(FCoreStyle::GetDefaultFontStyle("Regular", 12))
                        .SelectAllTextOnCommit(true)
                        .OnTextCommitted(this, &SEyefindBrowserWidget::HandleSearchCommitted)
                    ]

                    // Go / Navigate Button
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .Padding(2.0f, 0.0f)
                    [
                        SNew(SButton)
                        .ContentPadding(FMargin(10.0f, 4.0f))
                        .OnClicked(this, &SEyefindBrowserWidget::HandleGoButtonClicked)
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(TEXT("GO")))
                            .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
                            .ColorAndOpacity(FLinearColor(0.2f, 0.8f, 1.0f))
                        ]
                    ]

                    // Bookmark Drawer Toggle Button
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .Padding(4.0f, 0.0f)
                    [
                        SNew(SButton)
                        .ContentPadding(FMargin(8.0f, 4.0f))
                        .OnClicked(this, &SEyefindBrowserWidget::HandleBookmarkToggleClicked)
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(TEXT("★ Bookmarks")))
                            .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
                            .ColorAndOpacity(FLinearColor(1.0f, 0.75f, 0.2f))
                        ]
                    ]

                    // Zoom Controls Group
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .Padding(4.0f, 0.0f)
                    [
                        SNew(SHorizontalBox)

                        + SHorizontalBox::Slot()
                        .AutoWidth()
                        .Padding(1.0f, 0.0f)
                        [
                            SNew(SButton)
                            .ContentPadding(FMargin(6.0f, 4.0f))
                            .OnClicked(this, &SEyefindBrowserWidget::HandleZoomOutClicked)
                            [
                                SNew(STextBlock)
                                .Text(FText::FromString(TEXT("−")))
                                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 11))
                            ]
                        ]

                        + SHorizontalBox::Slot()
                        .AutoWidth()
                        .VAlign(VAlign_Center)
                        .Padding(4.0f, 0.0f)
                        [
                            SAssignNew(ZoomLevelTextBlock, STextBlock)
                            .Text(FText::FromString(TEXT("100%")))
                            .Font(FCoreStyle::GetDefaultFontStyle("Regular", 10))
                            .ColorAndOpacity(FLinearColor(0.7f, 0.7f, 0.7f))
                        ]

                        + SHorizontalBox::Slot()
                        .AutoWidth()
                        .Padding(1.0f, 0.0f)
                        [
                            SNew(SButton)
                            .ContentPadding(FMargin(6.0f, 4.0f))
                            .OnClicked(this, &SEyefindBrowserWidget::HandleZoomInClicked)
                            [
                                SNew(STextBlock)
                                .Text(FText::FromString(TEXT("+")))
                                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 11))
                            ]
                        ]

                        + SHorizontalBox::Slot()
                        .AutoWidth()
                        .Padding(2.0f, 0.0f)
                        [
                            SNew(SButton)
                            .ContentPadding(FMargin(4.0f, 4.0f))
                            .OnClicked(this, &SEyefindBrowserWidget::HandleResetZoomClicked)
                            [
                                SNew(STextBlock)
                                .Text(FText::FromString(TEXT("1:1")))
                                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
                            ]
                        ]
                    ]
                ]
            ]

            // 3. PROGRESS / LOADING INDICATOR
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(6.0f, 0.0f)
            [
                SAssignNew(LoadingProgressBar, SProgressBar)
                .Percent(1.0f)
                .FillColorAndOpacity(FLinearColor(1.0f, 0.35f, 0.6f, 1.0f))
            ]

            // 4. MAIN BROWSER BODY + BOOKMARK DRAWER AREA
            + SVerticalBox::Slot()
            .FillHeight(1.0f)
            .Padding(6.0f, 2.0f)
            [
                SNew(SHorizontalBox)

                // Bookmark Side Drawer
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SAssignNew(BookmarkDrawerBorder, SBorder)
                    .BorderBackgroundColor(FLinearColor(0.07f, 0.07f, 0.09f, 0.98f))
                    .Padding(6.0f)
                    .Visibility(EVisibility::Collapsed)
                    [
                        SNew(SBox)
                        .WidthOverride(220.0f)
                        [
                            SNew(SVerticalBox)

                            + SVerticalBox::Slot()
                            .AutoHeight()
                            .Padding(4.0f, 2.0f, 4.0f, 6.0f)
                            [
                                SNew(SHorizontalBox)
                                + SHorizontalBox::Slot()
                                .FillWidth(1.0f)
                                .VAlign(VAlign_Center)
                                [
                                    SNew(STextBlock)
                                    .Text(FText::FromString(TEXT("⭐ QUICK BOOKMARKS")))
                                    .Font(FCoreStyle::GetDefaultFontStyle("Bold", 11))
                                    .ColorAndOpacity(FLinearColor(1.0f, 0.8f, 0.2f))
                                ]
                                + SHorizontalBox::Slot()
                                .AutoWidth()
                                [
                                    SNew(SButton)
                                    .ContentPadding(FMargin(4.0f, 2.0f))
                                    .OnClicked(this, &SEyefindBrowserWidget::HandleAddBookmarkClicked)
                                    [
                                        SNew(STextBlock)
                                        .Text(FText::FromString(TEXT("+ Add")))
                                        .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
                                    ]
                                ]
                            ]

                            + SVerticalBox::Slot()
                            .FillHeight(1.0f)
                            [
                                SAssignNew(BookmarkScrollBox, SScrollBox)
                            ]
                        ]
                    ]
                ]

                // Web Browser Switcher (One SWebBrowser active per tab)
                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                [
                    SNew(SBorder)
                    .BorderBackgroundColor(FLinearColor(0.02f, 0.02f, 0.03f, 1.0f))
                    .Padding(0.0f)
                    [
                        SAssignNew(BrowserTabSwitcher, SWidgetSwitcher)
                        .WidgetIndex(0)
                        + SWidgetSwitcher::Slot()
                        [
                            InitialTab.WebBrowserInstance.ToSharedRef()
                        ]
                    ]
                ]
            ]

            // 5. STATUS BAR & METRICS FOOTER
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(6.0f, 4.0f)
            [
                SNew(SHorizontalBox)

                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                .VAlign(VAlign_Center)
                [
                    SAssignNew(StatusBarTextBlock, STextBlock)
                    .Text(FText::FromString(TEXT("🔒 Eyefind Engine Connected | Vice City Gateway: 127.0.0.1:8080 | SSL Active")))
                    .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
                    .ColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.65f))
                ]

                + SHorizontalBox::Slot()
                .AutoWidth()
                .VAlign(VAlign_Center)
                .Padding(8.0f, 0.0f)
                [
                    SAssignNew(PageTitleTextBlock, STextBlock)
                    .Text(FText::FromString(InitialTab.TabTitle))
                    .Font(FCoreStyle::GetDefaultFontStyle("Bold", 9))
                    .ColorAndOpacity(FLinearColor(0.9f, 0.4f, 0.7f))
                ]
            ]
        ]
    ];

    RebuildTabBar();
    RebuildBookmarkDrawer();
}

void SEyefindBrowserWidget::PopulateDefaultBookmarks()
{
    Bookmarks.Empty();

    Bookmarks.Add({ TEXT("Eyefind Portal"), TEXT("https://www.eyefind.info"), TEXT("🌐"), FLinearColor(1.0f, 0.3f, 0.6f), TEXT("Search") });
    Bookmarks.Add({ TEXT("Weazel News"), TEXT("https://www.weazelnews.com"), TEXT("📰"), FLinearColor(0.9f, 0.2f, 0.2f), TEXT("News") });
    Bookmarks.Add({ TEXT("BAWSAQ Market"), TEXT("https://www.bawsaq.com"), TEXT("📈"), FLinearColor(0.2f, 0.8f, 0.4f), TEXT("Finance") });
    Bookmarks.Add({ TEXT("Bleeter & Reelz"), TEXT("https://www.bleeter.biz"), TEXT("📱"), FLinearColor(0.2f, 0.6f, 1.0f), TEXT("Social") });
    Bookmarks.Add({ TEXT("Ammu-Nation"), TEXT("https://www.ammu-nation.net"), TEXT("🔫"), FLinearColor(0.9f, 0.5f, 0.1f), TEXT("Commerce") });
    Bookmarks.Add({ TEXT("Dynasty 8 Executive"), TEXT("https://www.dynasty8realestate.com"), TEXT("🏢"), FLinearColor(0.7f, 0.4f, 0.9f), TEXT("RealEstate") });
    Bookmarks.Add({ TEXT("Legendary Motorsport"), TEXT("https://www.legendarymotorsport.net"), TEXT("🏎️"), FLinearColor(0.95f, 0.8f, 0.1f), TEXT("Vehicles") });
    Bookmarks.Add({ TEXT("Lifeinvader"), TEXT("https://www.lifeinvader.com"), TEXT("👥"), FLinearColor(0.85f, 0.15f, 0.15f), TEXT("Social") });
    Bookmarks.Add({ TEXT("Maze Bank Online"), TEXT("https://www.mazebank.com"), TEXT("🏦"), FLinearColor(0.8f, 0.1f, 0.2f), TEXT("Banking") });
}

void SEyefindBrowserWidget::RebuildTabBar()
{
    if (!TabBarBox.IsValid()) return;
    TabBarBox->ClearChildren();

    for (int32 i = 0; i < OpenTabs.Num(); ++i)
    {
        const bool bIsActive = (i == ActiveTabIndex);
        const FLinearColor TabBgColor = bIsActive ? FLinearColor(0.14f, 0.14f, 0.18f, 1.0f) : FLinearColor(0.06f, 0.06f, 0.08f, 1.0f);
        const FLinearColor TextColor = bIsActive ? FLinearColor(1.0f, 1.0f, 1.0f) : FLinearColor(0.6f, 0.6f, 0.65f);

        FString DisplayTitle = OpenTabs[i].TabTitle;
        if (DisplayTitle.Len() > 14)
        {
            DisplayTitle = DisplayTitle.Left(12) + TEXT("…");
        }

        TabBarBox->AddSlot()
            .AutoWidth()
            .Padding(2.0f, 0.0f)
            [
                SNew(SBorder)
                .BorderBackgroundColor(TabBgColor)
                .Padding(FMargin(6.0f, 3.0f))
                [
                    SNew(SHorizontalBox)

                    // Tab Select Button
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .VAlign(VAlign_Center)
                    [
                        SNew(SButton)
                        .ButtonStyle(FCoreStyle::Get(), "NoBorder")
                        .OnClicked(this, &SEyefindBrowserWidget::HandleTabSelectClicked, i)
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(DisplayTitle))
                            .Font(FCoreStyle::GetDefaultFontStyle(bIsActive ? "Bold" : "Regular", 10))
                            .ColorAndOpacity(TextColor)
                        ]
                    ]

                    // Tab Close Button (if more than 1 tab)
                    + SHorizontalBox::Slot()
                    .AutoWidth()
                    .VAlign(VAlign_Center)
                    .Padding(4.0f, 0.0f, 0.0f, 0.0f)
                    [
                        SNew(SButton)
                        .ButtonStyle(FCoreStyle::Get(), "NoBorder")
                        .Visibility(OpenTabs.Num() > 1 ? EVisibility::Visible : EVisibility::Collapsed)
                        .OnClicked(this, &SEyefindBrowserWidget::HandleCloseTabClicked, i)
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(TEXT("✕")))
                            .Font(FCoreStyle::GetDefaultFontStyle("Regular", 8))
                            .ColorAndOpacity(FLinearColor(0.8f, 0.3f, 0.3f))
                        ]
                    ]
                ]
            ];
    }
}

void SEyefindBrowserWidget::RebuildBookmarkDrawer()
{
    if (!BookmarkScrollBox.IsValid()) return;
    BookmarkScrollBox->ClearChildren();

    for (const FEyefindBookmarkItem& Bookmark : Bookmarks)
    {
        BookmarkScrollBox->AddSlot()
            .Padding(2.0f, 2.0f)
            [
                SNew(SButton)
                .ButtonStyle(FCoreStyle::Get(), "NoBorder")
                .OnClicked(this, &SEyefindBrowserWidget::HandleQuickTabClicked, Bookmark.URL)
                [
                    SNew(SBorder)
                    .BorderBackgroundColor(FLinearColor(0.12f, 0.12f, 0.15f, 0.9f))
                    .Padding(FMargin(8.0f, 6.0f))
                    [
                        SNew(SHorizontalBox)

                        + SHorizontalBox::Slot()
                        .AutoWidth()
                        .VAlign(VAlign_Center)
                        .Padding(0.0f, 0.0f, 6.0f, 0.0f)
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(Bookmark.IconGlyph))
                            .Font(FCoreStyle::GetDefaultFontStyle("Regular", 12))
                        ]

                        + SHorizontalBox::Slot()
                        .FillWidth(1.0f)
                        .VAlign(VAlign_Center)
                        [
                            SNew(SVerticalBox)
                            + SVerticalBox::Slot()
                            .AutoHeight()
                            [
                                SNew(STextBlock)
                                .Text(FText::FromString(Bookmark.Title))
                                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
                                .ColorAndOpacity(Bookmark.AccentColor)
                            ]
                            + SVerticalBox::Slot()
                            .AutoHeight()
                            [
                                SNew(STextBlock)
                                .Text(FText::FromString(Bookmark.Category))
                                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 8))
                                .ColorAndOpacity(FLinearColor(0.5f, 0.5f, 0.55f))
                            ]
                        ]
                    ]
                ]
            ];
    }
}

void SEyefindBrowserWidget::NavigateToURL(const FString& InURL)
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;

    FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];
    ActiveTab.CurrentURL = InURL;

    if (ActiveTab.HistoryStack.IsEmpty() || ActiveTab.HistoryStack[ActiveTab.HistoryIndex] != InURL)
    {
        if (ActiveTab.HistoryIndex < ActiveTab.HistoryStack.Num() - 1)
        {
            ActiveTab.HistoryStack.RemoveAt(ActiveTab.HistoryIndex + 1, ActiveTab.HistoryStack.Num() - (ActiveTab.HistoryIndex + 1));
        }
        ActiveTab.HistoryStack.Add(InURL);
        ActiveTab.HistoryIndex = ActiveTab.HistoryStack.Num() - 1;
    }

    if (AddressBarTextBox.IsValid())
    {
        AddressBarTextBox->SetText(FText::FromString(InURL));
    }

    ActiveTab.bIsLoading = true;
    ActiveTab.LoadingProgress = 0.25f;
    if (LoadingProgressBar.IsValid())
    {
        LoadingProgressBar->SetPercent(0.25f);
    }

    if (ActiveTab.WebBrowserInstance.IsValid())
    {
        ActiveTab.WebBrowserInstance->LoadURL(InURL);
    }

    if (SecurityBadgeTextBlock.IsValid())
    {
        const bool bIsSSL = InURL.StartsWith(TEXT("https://"));
        SecurityBadgeTextBlock->SetText(FText::FromString(bIsSSL ? TEXT("🔒") : TEXT("⚠️")));
        SecurityBadgeTextBlock->SetColorAndOpacity(bIsSSL ? FLinearColor(0.2f, 0.9f, 0.4f) : FLinearColor(0.9f, 0.6f, 0.1f));
    }

    OnUrlNavigatedDelegate.ExecuteIfBound(InURL);
}

void SEyefindBrowserWidget::NavigateBack()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];

    if (ActiveTab.HistoryIndex > 0)
    {
        ActiveTab.HistoryIndex--;
        const FString PrevURL = ActiveTab.HistoryStack[ActiveTab.HistoryIndex];
        ActiveTab.CurrentURL = PrevURL;
        if (AddressBarTextBox.IsValid())
        {
            AddressBarTextBox->SetText(FText::FromString(PrevURL));
        }
        if (ActiveTab.WebBrowserInstance.IsValid())
        {
            ActiveTab.WebBrowserInstance->LoadURL(PrevURL);
        }
        OnUrlNavigatedDelegate.ExecuteIfBound(PrevURL);
    }
}

void SEyefindBrowserWidget::NavigateForward()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];

    if (ActiveTab.HistoryIndex < ActiveTab.HistoryStack.Num() - 1)
    {
        ActiveTab.HistoryIndex++;
        const FString NextURL = ActiveTab.HistoryStack[ActiveTab.HistoryIndex];
        ActiveTab.CurrentURL = NextURL;
        if (AddressBarTextBox.IsValid())
        {
            AddressBarTextBox->SetText(FText::FromString(NextURL));
        }
        if (ActiveTab.WebBrowserInstance.IsValid())
        {
            ActiveTab.WebBrowserInstance->LoadURL(NextURL);
        }
        OnUrlNavigatedDelegate.ExecuteIfBound(NextURL);
    }
}

void SEyefindBrowserWidget::RefreshPage()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];

    if (ActiveTab.WebBrowserInstance.IsValid())
    {
        ActiveTab.WebBrowserInstance->Reload();
    }
    else
    {
        NavigateToURL(ActiveTab.CurrentURL);
    }
}

void SEyefindBrowserWidget::StopLoading()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];

    if (ActiveTab.WebBrowserInstance.IsValid())
    {
        ActiveTab.WebBrowserInstance->StopLoad();
    }
    ActiveTab.bIsLoading = false;
    ActiveTab.LoadingProgress = 1.0f;
    if (LoadingProgressBar.IsValid())
    {
        LoadingProgressBar->SetPercent(1.0f);
    }
}

void SEyefindBrowserWidget::CreateNewTab(const FString& InURL)
{
    if (OpenTabs.Num() >= MaxAllowedTabs)
    {
        UE_LOG(LogTemp, Warning, TEXT("[SEyefindBrowserWidget] Max tabs reached (%d)."), MaxAllowedTabs);
        return;
    }

    FEyefindBrowserTab NewTab;
    NewTab.TabID = FGuid::NewGuid().ToString();
    NewTab.TabTitle = TEXT("New Tab");
    NewTab.CurrentURL = InURL;
    NewTab.HistoryStack.Add(InURL);
    NewTab.HistoryIndex = 0;
    NewTab.ZoomLevel = 1.0f;
    NewTab.bIsLoading = false;
    NewTab.LoadingProgress = 1.0f;

    NewTab.WebBrowserInstance = SNew(SWebBrowser)
        .InitialURL(InURL)
        .ShowControls(false)
        .ShowAddressBar(false)
        .OnUrlChanged(FOnTextChanged::CreateRaw(this, &SEyefindBrowserWidget::HandleBrowserUrlChanged))
        .OnTitleChanged(FOnTextChanged::CreateRaw(this, &SEyefindBrowserWidget::HandleBrowserTitleChanged))
        .OnLoadCompleted(FSimpleDelegate::CreateRaw(this, &SEyefindBrowserWidget::HandleBrowserLoadCompleted))
        .OnLoadError(FSimpleDelegate::CreateRaw(this, &SEyefindBrowserWidget::HandleBrowserLoadError));

    const int32 NewIndex = OpenTabs.Add(NewTab);
    if (BrowserTabSwitcher.IsValid() && NewTab.WebBrowserInstance.IsValid())
    {
        BrowserTabSwitcher->AddSlot()
        [
            NewTab.WebBrowserInstance.ToSharedRef()
        ];
    }

    SwitchToTab(NewIndex);
}

void SEyefindBrowserWidget::CloseTab(int32 TabIndex)
{
    if (OpenTabs.Num() <= 1 || !OpenTabs.IsValidIndex(TabIndex)) return;

    OpenTabs.RemoveAt(TabIndex);
    if (BrowserTabSwitcher.IsValid())
    {
        // Rebuild switcher slots
        BrowserTabSwitcher->ClearChildren();
        for (const FEyefindBrowserTab& Tab : OpenTabs)
        {
            if (Tab.WebBrowserInstance.IsValid())
            {
                BrowserTabSwitcher->AddSlot()
                [
                    Tab.WebBrowserInstance.ToSharedRef()
                ];
            }
        }
    }

    ActiveTabIndex = FMath::Clamp(ActiveTabIndex >= OpenTabs.Num() ? OpenTabs.Num() - 1 : ActiveTabIndex, 0, OpenTabs.Num() - 1);
    SwitchToTab(ActiveTabIndex);
}

void SEyefindBrowserWidget::SwitchToTab(int32 TabIndex)
{
    if (!OpenTabs.IsValidIndex(TabIndex)) return;

    ActiveTabIndex = TabIndex;
    const FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];

    if (BrowserTabSwitcher.IsValid())
    {
        BrowserTabSwitcher->SetActiveWidgetIndex(ActiveTabIndex);
    }

    if (AddressBarTextBox.IsValid())
    {
        AddressBarTextBox->SetText(FText::FromString(ActiveTab.CurrentURL));
    }

    if (PageTitleTextBlock.IsValid())
    {
        PageTitleTextBlock->SetText(FText::FromString(ActiveTab.TabTitle));
    }

    if (ZoomLevelTextBlock.IsValid())
    {
        ZoomLevelTextBlock->SetText(FText::FromString(FString::Printf(TEXT("%d%%"), FMath::RoundToInt(ActiveTab.ZoomLevel * 100.0f))));
    }

    if (LoadingProgressBar.IsValid())
    {
        LoadingProgressBar->SetPercent(ActiveTab.LoadingProgress);
    }

    RebuildTabBar();
}

void SEyefindBrowserWidget::ToggleBookmarkDrawer()
{
    bBookmarkDrawerOpen = !bBookmarkDrawerOpen;
    if (BookmarkDrawerBorder.IsValid())
    {
        BookmarkDrawerBorder->SetVisibility(bBookmarkDrawerOpen ? EVisibility::Visible : EVisibility::Collapsed);
    }
}

void SEyefindBrowserWidget::AddCurrentPageToBookmarks()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    const FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];

    FEyefindBookmarkItem NewBookmark;
    NewBookmark.Title = ActiveTab.TabTitle.IsEmpty() ? ActiveTab.CurrentURL : ActiveTab.TabTitle;
    NewBookmark.URL = ActiveTab.CurrentURL;
    NewBookmark.IconGlyph = TEXT("🔖");
    NewBookmark.AccentColor = FLinearColor(0.3f, 0.8f, 1.0f);
    NewBookmark.Category = TEXT("User Saved");

    Bookmarks.Add(NewBookmark);
    RebuildBookmarkDrawer();
}

void SEyefindBrowserWidget::RemoveBookmark(const FString& InURL)
{
    Bookmarks.RemoveAll([&InURL](const FEyefindBookmarkItem& Item) {
        return Item.URL == InURL;
    });
    RebuildBookmarkDrawer();
}

void SEyefindBrowserWidget::ZoomIn()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];
    ActiveTab.ZoomLevel = FMath::Clamp(ActiveTab.ZoomLevel + 0.1f, 0.5f, 2.5f);
    ApplyZoomToActiveTab();
}

void SEyefindBrowserWidget::ZoomOut()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];
    ActiveTab.ZoomLevel = FMath::Clamp(ActiveTab.ZoomLevel - 0.1f, 0.5f, 2.5f);
    ApplyZoomToActiveTab();
}

void SEyefindBrowserWidget::ResetZoom()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];
    ActiveTab.ZoomLevel = 1.0f;
    ApplyZoomToActiveTab();
}

float SEyefindBrowserWidget::GetCurrentZoomLevel() const
{
    if (OpenTabs.IsValidIndex(ActiveTabIndex))
    {
        return OpenTabs[ActiveTabIndex].ZoomLevel;
    }
    return 1.0f;
}

void SEyefindBrowserWidget::ApplyZoomToActiveTab()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    const FEyefindBrowserTab& ActiveTab = OpenTabs[ActiveTabIndex];

    if (ZoomLevelTextBlock.IsValid())
    {
        ZoomLevelTextBlock->SetText(FText::FromString(FString::Printf(TEXT("%d%%"), FMath::RoundToInt(ActiveTab.ZoomLevel * 100.0f))));
    }

    OnZoomChangedDelegate.ExecuteIfBound(ActiveTab.ZoomLevel);
}

void SEyefindBrowserWidget::Tick(const FGeometry& AllottedGeometry, const double InCurrentTime, const float InDeltaTime)
{
    SCompoundWidget::Tick(AllottedGeometry, InCurrentTime, InDeltaTime);

    // Update Click Ripple Animation
    if (ClickRippleAnimTimer > 0.0f)
    {
        ClickRippleAnimTimer = FMath::Max(0.0f, ClickRippleAnimTimer - InDeltaTime * 2.5f);
    }

    // Update Gamepad Virtual Cursor Motion with Acceleration and Damping
    if (bGamepadCursorEnabled)
    {
        if (!ThumbstickInput.IsNearlyZero())
        {
            const FVector2D TargetVelocity = ThumbstickInput * CursorSpeed;
            CursorVelocity = FMath::Vector2DInterpTo(CursorVelocity, TargetVelocity, InDeltaTime, CursorAcceleration / CursorSpeed);
        }
        else
        {
            CursorVelocity = FMath::Vector2DInterpTo(CursorVelocity, FVector2D::ZeroVector, InDeltaTime, CursorFriction);
        }

        if (!CursorVelocity.IsNearlyZero(0.1f))
        {
            VirtualCursorPos += CursorVelocity * InDeltaTime;

            const FVector2D ViewportSize = AllottedGeometry.GetLocalSize();
            VirtualCursorPos.X = FMath::Clamp(VirtualCursorPos.X, 0.0f, ViewportSize.X);
            VirtualCursorPos.Y = FMath::Clamp(VirtualCursorPos.Y, 0.0f, ViewportSize.Y);
        }

        // Process Right-Stick Scrolling on Browser
        if (!RightStickScrollInput.IsNearlyZero() && OpenTabs.IsValidIndex(ActiveTabIndex))
        {
            // Inject mouse wheel scroll event
            const float ScrollDelta = RightStickScrollInput.Y * InDeltaTime * 600.0f;
            const FPointerEvent ScrollEvent(
                0,
                VirtualCursorPos,
                VirtualCursorPos,
                TSet<FKey>(),
                EKeys::MouseWheelAxis,
                ScrollDelta,
                FModifierKeysState()
            );
            OnMouseWheel(AllottedGeometry, ScrollEvent);
        }
    }
}

int32 SEyefindBrowserWidget::OnPaint(const FPaintArgs& Args, const FGeometry& AllottedGeometry, const FSlateRect& MyCullingRect, FSlateWindowElementList& OutDrawElements, int32 LayerId, const FWidgetStyle& InWidgetStyle, bool bParentEnabled) const
{
    // Paint Child Widgets First
    int32 MaxLayerId = SCompoundWidget::OnPaint(Args, AllottedGeometry, MyCullingRect, OutDrawElements, LayerId, InWidgetStyle, bParentEnabled);

    if (bGamepadCursorEnabled)
    {
        const int32 CursorLayerId = MaxLayerId + 10;
        const FVector2D CursorScreenPos = VirtualCursorPos;

        // 1. Draw Click Ripple Animation if Active
        if (ClickRippleAnimTimer > 0.0f)
        {
            const float RippleRadius = (1.0f - ClickRippleAnimTimer) * 36.0f + 8.0f;
            const float RippleAlpha = ClickRippleAnimTimer * 0.8f;
            const FLinearColor RippleColor(0.2f, 0.8f, 1.0f, RippleAlpha);

            TArray<FVector2D> CirclePoints;
            const int32 Segments = 24;
            for (int32 i = 0; i <= Segments; ++i)
            {
                const float Angle = (float)i / (float)Segments * 2.0f * PI;
                CirclePoints.Add(LastClickPos + FVector2D(FMath::Cos(Angle), FMath::Sin(Angle)) * RippleRadius);
            }

            FSlateDrawElement::MakeLines(
                OutDrawElements,
                CursorLayerId - 1,
                AllottedGeometry.ToPaintGeometry(),
                CirclePoints,
                ESlateDrawEffect::None,
                RippleColor,
                false,
                2.0f
            );
        }

        // 2. Draw Virtual Cursor Body (Futuristic Vice City Neon Cursor / Crosshair)
        const FLinearColor CursorColor = bIsLeftMouseButtonDown ? FLinearColor(1.0f, 0.2f, 0.5f, 1.0f) :
                                        (bIsCursorHoveringInteractive ? FLinearColor(0.2f, 0.9f, 1.0f, 1.0f) : FLinearColor(1.0f, 0.85f, 0.2f, 0.95f));

        // Cursor Pointer Arrow / Chevron
        TArray<FVector2D> ArrowPoints;
        ArrowPoints.Add(CursorScreenPos);
        ArrowPoints.Add(CursorScreenPos + FVector2D(0.0f, 20.0f));
        ArrowPoints.Add(CursorScreenPos + FVector2D(5.0f, 15.0f));
        ArrowPoints.Add(CursorScreenPos + FVector2D(14.0f, 22.0f));
        ArrowPoints.Add(CursorScreenPos + FVector2D(18.0f, 18.0f));
        ArrowPoints.Add(CursorScreenPos + FVector2D(9.0f, 11.0f));
        ArrowPoints.Add(CursorScreenPos + FVector2D(16.0f, 9.0f));
        ArrowPoints.Add(CursorScreenPos);

        FSlateDrawElement::MakeLines(
            OutDrawElements,
            CursorLayerId,
            AllottedGeometry.ToPaintGeometry(),
            ArrowPoints,
            ESlateDrawEffect::None,
            CursorColor,
            false,
            2.5f
        );

        // Center Glow Dot
        TArray<FVector2D> DotPoints;
        DotPoints.Add(CursorScreenPos + FVector2D(-1.0f, -1.0f));
        DotPoints.Add(CursorScreenPos + FVector2D(1.0f, 1.0f));
        FSlateDrawElement::MakeLines(
            OutDrawElements,
            CursorLayerId + 1,
            AllottedGeometry.ToPaintGeometry(),
            DotPoints,
            ESlateDrawEffect::None,
            FLinearColor::White,
            false,
            3.0f
        );

        MaxLayerId = CursorLayerId + 2;
    }

    return MaxLayerId;
}

FReply SEyefindBrowserWidget::OnAnalogValueChanged(const FGeometry& MyGeometry, const FAnalogInputEvent& InAnalogInputEvent)
{
    const FKey Key = InAnalogInputEvent.GetKey();
    const float Value = InAnalogInputEvent.GetAnalogValue();

    if (Key == EKeys::Gamepad_LeftX)
    {
        ThumbstickInput.X = (FMath::Abs(Value) > StickDeadzone) ? Value : 0.0f;
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_LeftY)
    {
        ThumbstickInput.Y = (FMath::Abs(Value) > StickDeadzone) ? -Value : 0.0f;
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_RightX)
    {
        RightStickScrollInput.X = (FMath::Abs(Value) > StickDeadzone) ? Value : 0.0f;
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_RightY)
    {
        RightStickScrollInput.Y = (FMath::Abs(Value) > StickDeadzone) ? Value : 0.0f;
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_LeftTriggerAxis && Value > 0.6f)
    {
        ZoomOut();
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_RightTriggerAxis && Value > 0.6f)
    {
        ZoomIn();
        return FReply::Handled();
    }

    return FReply::Unhandled();
}

FReply SEyefindBrowserWidget::OnKeyDown(const FGeometry& MyGeometry, const FKeyEvent& InKeyEvent)
{
    const FKey Key = InKeyEvent.GetKey();

    if (Key == EKeys::Gamepad_FaceButton_Bottom) // 'A' / Cross button -> Virtual Click
    {
        bIsLeftMouseButtonDown = true;
        LastClickPos = VirtualCursorPos;
        ClickRippleAnimTimer = 1.0f;

        const FPointerEvent ClickEvent(
            0,
            VirtualCursorPos,
            VirtualCursorPos,
            TSet<FKey>({ EKeys::LeftMouseButton }),
            EKeys::LeftMouseButton,
            0.0f,
            FModifierKeysState()
        );
        OnMouseButtonDown(MyGeometry, ClickEvent);
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_FaceButton_Right) // 'B' / Circle button -> Navigate Back
    {
        NavigateBack();
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_FaceButton_Top) // 'Y' / Triangle button -> Refresh
    {
        RefreshPage();
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_FaceButton_Left) // 'X' / Square button -> Bookmark Drawer
    {
        ToggleBookmarkDrawer();
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_LeftShoulder) // LB -> Previous Tab
    {
        if (ActiveTabIndex > 0)
        {
            SwitchToTab(ActiveTabIndex - 1);
        }
        return FReply::Handled();
    }
    else if (Key == EKeys::Gamepad_RightShoulder) // RB -> Next Tab
    {
        if (ActiveTabIndex < OpenTabs.Num() - 1)
        {
            SwitchToTab(ActiveTabIndex + 1);
        }
        return FReply::Handled();
    }

    return FReply::Unhandled();
}

FReply SEyefindBrowserWidget::OnKeyUp(const FGeometry& MyGeometry, const FKeyEvent& InKeyEvent)
{
    if (InKeyEvent.GetKey() == EKeys::Gamepad_FaceButton_Bottom)
    {
        bIsLeftMouseButtonDown = false;
        const FPointerEvent ReleaseEvent(
            0,
            VirtualCursorPos,
            VirtualCursorPos,
            TSet<FKey>(),
            EKeys::LeftMouseButton,
            0.0f,
            FModifierKeysState()
        );
        OnMouseButtonUp(MyGeometry, ReleaseEvent);
        return FReply::Handled();
    }
    return FReply::Unhandled();
}

FReply SEyefindBrowserWidget::OnMouseMove(const FGeometry& MyGeometry, const FPointerEvent& MouseEvent)
{
    return FReply::Unhandled();
}

FReply SEyefindBrowserWidget::OnMouseButtonDown(const FGeometry& MyGeometry, const FPointerEvent& MouseEvent)
{
    return FReply::Unhandled();
}

FReply SEyefindBrowserWidget::OnMouseButtonUp(const FGeometry& MyGeometry, const FPointerEvent& MouseEvent)
{
    return FReply::Unhandled();
}

FReply SEyefindBrowserWidget::OnMouseWheel(const FGeometry& MyGeometry, const FPointerEvent& MouseEvent)
{
    return FReply::Unhandled();
}

void SEyefindBrowserWidget::HandleBrowserUrlChanged(const FText& InURL)
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    OpenTabs[ActiveTabIndex].CurrentURL = InURL.ToString();

    if (AddressBarTextBox.IsValid())
    {
        AddressBarTextBox->SetText(InURL);
    }
    OnUrlNavigatedDelegate.ExecuteIfBound(InURL.ToString());
}

void SEyefindBrowserWidget::HandleBrowserTitleChanged(const FText& InTitle)
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    OpenTabs[ActiveTabIndex].TabTitle = InTitle.ToString();

    if (PageTitleTextBlock.IsValid())
    {
        PageTitleTextBlock->SetText(InTitle);
    }
    RebuildTabBar();
    OnTitleChangedDelegate.ExecuteIfBound(OpenTabs[ActiveTabIndex].TabID, InTitle.ToString());
}

void SEyefindBrowserWidget::HandleBrowserLoadCompleted()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    OpenTabs[ActiveTabIndex].bIsLoading = false;
    OpenTabs[ActiveTabIndex].LoadingProgress = 1.0f;

    if (LoadingProgressBar.IsValid())
    {
        LoadingProgressBar->SetPercent(1.0f);
    }
}

void SEyefindBrowserWidget::HandleBrowserLoadError()
{
    if (!OpenTabs.IsValidIndex(ActiveTabIndex)) return;
    OpenTabs[ActiveTabIndex].bIsLoading = false;
    OpenTabs[ActiveTabIndex].LoadingProgress = 0.0f;

    if (LoadingProgressBar.IsValid())
    {
        LoadingProgressBar->SetPercent(0.0f);
    }
    if (StatusBarTextBlock.IsValid())
    {
        StatusBarTextBlock->SetText(FText::FromString(TEXT("❌ Page Load Error: Unable to resolve host on Eyefind Gateway.")));
        StatusBarTextBlock->SetColorAndOpacity(FLinearColor(1.0f, 0.3f, 0.3f));
    }
}

FReply SEyefindBrowserWidget::HandleSearchCommitted(const FText& Text, ETextCommit::Type CommitMethod)
{
    if (CommitMethod == ETextCommit::OnEnter)
    {
        FString QueryOrURL = Text.ToString().TrimStartAndEnd();
        if (!QueryOrURL.StartsWith(TEXT("http://")) && !QueryOrURL.StartsWith(TEXT("https://")))
        {
            if (QueryOrURL.Contains(TEXT(".")) && !QueryOrURL.Contains(TEXT(" ")))
            {
                QueryOrURL = FString::Printf(TEXT("https://%s"), *QueryOrURL);
            }
            else
            {
                QueryOrURL = FString::Printf(TEXT("https://www.eyefind.info/search?q=%s"), *FGenericPlatformHttp::UrlEncode(QueryOrURL));
            }
        }
        NavigateToURL(QueryOrURL);
        return FReply::Handled();
    }
    return FReply::Unhandled();
}

FReply SEyefindBrowserWidget::HandleGoButtonClicked()
{
    if (AddressBarTextBox.IsValid())
    {
        HandleSearchCommitted(AddressBarTextBox->GetText(), ETextCommit::OnEnter);
        return FReply::Handled();
    }
    return FReply::Unhandled();
}

FReply SEyefindBrowserWidget::HandleQuickTabClicked(FString TargetURL)
{
    NavigateToURL(TargetURL);
    if (bBookmarkDrawerOpen)
    {
        ToggleBookmarkDrawer();
    }
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleBackClicked()
{
    NavigateBack();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleForwardClicked()
{
    NavigateForward();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleRefreshClicked()
{
    RefreshPage();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleStopClicked()
{
    StopLoading();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleBookmarkToggleClicked()
{
    ToggleBookmarkDrawer();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleAddBookmarkClicked()
{
    AddCurrentPageToBookmarks();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleZoomInClicked()
{
    ZoomIn();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleZoomOutClicked()
{
    ZoomOut();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleResetZoomClicked()
{
    ResetZoom();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleNewTabClicked()
{
    CreateNewTab();
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleCloseTabClicked(int32 TabIndexToClose)
{
    CloseTab(TabIndexToClose);
    return FReply::Handled();
}

FReply SEyefindBrowserWidget::HandleTabSelectClicked(int32 TabIndexToSelect)
{
    SwitchToTab(TabIndexToSelect);
    return FReply::Handled();
}
