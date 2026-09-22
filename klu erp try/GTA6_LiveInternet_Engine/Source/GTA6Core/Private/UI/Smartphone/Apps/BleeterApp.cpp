// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "UI/Smartphone/Apps/BleeterApp.h"
#include "Social/ViralClipFeedSubsystem.h"
#include "Kismet/GameplayStatics.h"

UBleeterApp::UBleeterApp(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    AppID = EPhoneAppID::BleeterSocial;
    AppDisplayName = FText::FromString(TEXT("Bleeter & Reelz"));
    PreferredStatusBarTheme = EPhoneStatusBarTheme::Transparent;
    bRequiresInternet = true;
    bCanBeBackgrounded = true;
    CurrentClipIndex = 0;
}

void UBleeterApp::NativeConstruct()
{
    Super::NativeConstruct();

    if (UGameInstance* GI = GetGameInstance())
    {
        if (UViralClipFeedSubsystem* FeedSubsystem = GI->GetSubsystem<UViralClipFeedSubsystem>())
        {
            FeedSubsystem->OnFeedRefreshed.AddDynamic(this, &UBleeterApp::HandleSubsystemFeedRefreshed);
            FeedSubsystem->OnPlayerClipWentViral.AddDynamic(this, &UBleeterApp::HandleSubsystemPlayerClipWentViral);
        }
    }
}

void UBleeterApp::NativeDestruct()
{
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UViralClipFeedSubsystem* FeedSubsystem = GI->GetSubsystem<UViralClipFeedSubsystem>())
        {
            FeedSubsystem->OnFeedRefreshed.RemoveDynamic(this, &UBleeterApp::HandleSubsystemFeedRefreshed);
            FeedSubsystem->OnPlayerClipWentViral.RemoveDynamic(this, &UBleeterApp::HandleSubsystemPlayerClipWentViral);
        }
    }

    Super::NativeDestruct();
}

void UBleeterApp::NativeOnAppLaunched(const FString& LaunchParams)
{
    Super::NativeOnAppLaunched(LaunchParams);
    RefreshFeed();
}

void UBleeterApp::NativeOnAppResumed()
{
    Super::NativeOnAppResumed();
    RefreshFeed();
}

void UBleeterApp::NativeOnAppSuspended()
{
    Super::NativeOnAppSuspended();
}

void UBleeterApp::RefreshFeed()
{
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UViralClipFeedSubsystem* FeedSubsystem = GI->GetSubsystem<UViralClipFeedSubsystem>())
        {
            FeedSubsystem->FetchFeedBatch(15);
            CachedFeedList = FeedSubsystem->CachedFeed;
            OnFeedUpdated.Broadcast(CachedFeedList);
        }
    }
}

void UBleeterApp::SwitchFeedTab(EBleeterFeedTab NewTab)
{
    if (CurrentTab != NewTab)
    {
        CurrentTab = NewTab;
        CurrentClipIndex = 0;
        PlayHapticFeedback(TEXT("TabSwitch"));
        OnFeedUpdated.Broadcast(GetActiveFeed());
    }
}

void UBleeterApp::LikeCurrentPost(const FString& PostID)
{
    if (LikedPostIDs.Contains(PostID))
    {
        LikedPostIDs.Remove(PostID);
        for (FViralClipPost& Post : CachedFeedList)
        {
            if (Post.PostID == PostID)
            {
                Post.LikeCount = FMath::Max(0, Post.LikeCount - 1);
                OnPostLiked.Broadcast(PostID, Post.LikeCount);
                break;
            }
        }
    }
    else
    {
        LikedPostIDs.Add(PostID);
        for (FViralClipPost& Post : CachedFeedList)
        {
            if (Post.PostID == PostID)
            {
                Post.LikeCount += 1;
                OnPostLiked.Broadcast(PostID, Post.LikeCount);
                break;
            }
        }

        if (UGameInstance* GI = GetGameInstance())
        {
            if (UViralClipFeedSubsystem* FeedSubsystem = GI->GetSubsystem<UViralClipFeedSubsystem>())
            {
                FeedSubsystem->LikePost(PostID);
            }
        }

        PlayHapticFeedback(TEXT("DoubleTapLike"));
    }
}

void UBleeterApp::SharePost(const FString& PostID)
{
    PlayHapticFeedback(TEXT("ShareClip"));
}

void UBleeterApp::PostBleet(const FString& Caption, const FString& SoundTrack, bool bAttachClip)
{
    FViralClipPost NewPost;
    NewPost.PostID = FGuid::NewGuid().ToString(EGuidFormats::Short);
    NewPost.CreatorHandle = PlayerHandle;
    NewPost.Caption = Caption;
    NewPost.SoundTrackTitle = SoundTrack;
    NewPost.ViewCount = FMath::RandRange(500, 5000);
    NewPost.LikeCount = FMath::RandRange(20, 450);
    NewPost.CommentCount = FMath::RandRange(2, 45);
    NewPost.bInvolvesProtagonists = true;
    NewPost.TopComments.Add(TEXT("ViceCitySurfer: Yoooo is this for real?! 🔥"));
    NewPost.TopComments.Add(TEXT("LeonidaPD_Fan: The cops are already tracking your IP lmao"));

    CachedFeedList.Insert(NewPost, 0);
    PlayerFollowerCount += FMath::RandRange(50, 400);

    const bool bViral = (NewPost.ViewCount > 3000);
    PlayHapticFeedback(TEXT("PostSuccess"));

    OnNewPostPublished.Broadcast(NewPost.PostID, Caption, bViral);
    OnFeedUpdated.Broadcast(CachedFeedList);
}

void UBleeterApp::NextClip()
{
    TArray<FViralClipPost> ActiveFeed = GetActiveFeed();
    if (ActiveFeed.Num() > 0)
    {
        CurrentClipIndex = (CurrentClipIndex + 1) % ActiveFeed.Num();
        PlayHapticFeedback(TEXT("ScrollTick"));
    }
}

void UBleeterApp::PreviousClip()
{
    TArray<FViralClipPost> ActiveFeed = GetActiveFeed();
    if (ActiveFeed.Num() > 0)
    {
        CurrentClipIndex = (CurrentClipIndex - 1 + ActiveFeed.Num()) % ActiveFeed.Num();
        PlayHapticFeedback(TEXT("ScrollTick"));
    }
}

TArray<FViralClipPost> UBleeterApp::GetActiveFeed() const
{
    TArray<FViralClipPost> FilteredFeed;

    switch (CurrentTab)
    {
    case EBleeterFeedTab::ForYou:
        FilteredFeed = CachedFeedList;
        break;

    case EBleeterFeedTab::Following:
        for (const FViralClipPost& Post : CachedFeedList)
        {
            if (Post.CreatorHandle.Contains(TEXT("Official")) || Post.CreatorHandle.Contains(TEXT("Lucia")) || Post.CreatorHandle.Contains(TEXT("Jason")))
            {
                FilteredFeed.Add(Post);
            }
        }
        break;

    case EBleeterFeedTab::TrendingCrime:
        for (const FViralClipPost& Post : CachedFeedList)
        {
            if (Post.bInvolvesProtagonists || Post.Caption.Contains(TEXT("#Chase")) || Post.Caption.Contains(TEXT("#Robbery")) || Post.Caption.Contains(TEXT("PD")))
            {
                FilteredFeed.Add(Post);
            }
        }
        break;

    case EBleeterFeedTab::MyProfile:
        for (const FViralClipPost& Post : CachedFeedList)
        {
            if (Post.CreatorHandle.Equals(PlayerHandle, ESearchCase::IgnoreCase) || Post.bInvolvesProtagonists)
            {
                FilteredFeed.Add(Post);
            }
        }
        break;

    default:
        FilteredFeed = CachedFeedList;
        break;
    }

    return FilteredFeed;
}

bool UBleeterApp::GetCurrentActivePost(FViralClipPost& OutPost) const
{
    TArray<FViralClipPost> ActiveFeed = GetActiveFeed();
    if (ActiveFeed.IsValidIndex(CurrentClipIndex))
    {
        OutPost = ActiveFeed[CurrentClipIndex];
        return true;
    }
    return false;
}

void UBleeterApp::HandleSubsystemFeedRefreshed(const TArray<FViralClipPost>& NewFeed)
{
    CachedFeedList = NewFeed;
    OnFeedUpdated.Broadcast(GetActiveFeed());
}

void UBleeterApp::HandleSubsystemPlayerClipWentViral(const FString& PostID, int64 InitialViews)
{
    PlayerFollowerCount += static_cast<int32>(InitialViews / 10);
    PlayerNotorietyScore = FMath::Clamp(PlayerNotorietyScore + 5, 0, 100);

    for (FViralClipPost& Post : CachedFeedList)
    {
        if (Post.PostID == PostID)
        {
            Post.ViewCount += InitialViews;
            Post.LikeCount += static_cast<int32>(InitialViews * 0.12f);
            break;
        }
    }

    PlayHapticFeedback(TEXT("ViralAlert"));
    OnFeedUpdated.Broadcast(GetActiveFeed());
}
