// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "Social/ViralClipFeedSubsystem.h"

void UViralClipFeedSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    SeedInitialViralClips();
    UE_LOG(LogTemp, Log, TEXT("[LeonidaReelz] UViralClipFeedSubsystem initialized with %d trending clips."), CachedFeed.Num());
}

void UViralClipFeedSubsystem::SeedInitialViralClips()
{
    CachedFeed.Empty();

    FViralClipPost Clip1;
    Clip1.PostID = TEXT("CLIP_001_SWAMP_GATOR");
    Clip1.CreatorHandle = TEXT("@LeonidaManOfficial");
    Clip1.Caption = TEXT("Just walking my 14ft gator into the 24/7 gas station for some beef jerky #ViceCityVibes #FloridaLife #Reelz");
    Clip1.SoundTrackTitle = TEXT("Vice Wave FM - Tropical Heatwave (Remix)");
    Clip1.ViewCount = 2840000;
    Clip1.LikeCount = 612000;
    Clip1.CommentCount = 14300;
    Clip1.TopComments.Add(TEXT("@gator_whisperer: Bro didn't even put him on a leash 💀"));
    Clip1.TopComments.Add(TEXT("@vice_patrol: VCPD would like to know your location."));
    Clip1.TopComments.Add(TEXT("@lucia_fan_club: Normal day in Kelly County tbh."));
    Clip1.VideoAssetURL = TEXT("/Game/Cinematics/Clips/GatorGasStation.mp4");
    CachedFeed.Add(Clip1);

    FViralClipPost Clip2;
    Clip2.PostID = TEXT("CLIP_002_HIGHWAY_CHASE");
    Clip2.CreatorHandle = TEXT("@ViceCityDashcam");
    Clip2.Caption = TEXT("Twin turbo Cheetah doing 220mph past three VCPD cruisers on the freeway bridge! Who is this couple?! #LeonidaDrift");
    Clip2.SoundTrackTitle = TEXT("Radio Broker - Street Runnin'");
    Clip2.ViewCount = 5910000;
    Clip2.LikeCount = 1240000;
    Clip2.CommentCount = 48200;
    Clip2.TopComments.Add(TEXT("@jason_d_99: Need that exhaust setup fr."));
    Clip2.TopComments.Add(TEXT("@weazel_news: Send footage to tips@weazelnews.com for $50 reward."));
    Clip2.TopComments.Add(TEXT("@miami_queen: That's Lucia and her boy for sure 🔥"));
    Clip2.VideoAssetURL = TEXT("/Game/Cinematics/Clips/HighwayPursuit.mp4");
    Clip2.bInvolvesProtagonists = true;
    CachedFeed.Add(Clip2);

    FViralClipPost Clip3;
    Clip3.PostID = TEXT("CLIP_003_LUXURY_YACHT");
    Clip3.CreatorHandle = TEXT("@StarfishIslandVip");
    Clip3.Caption = TEXT("Sunset pool party on the 160ft superyacht before the hurricane arrives 🥂🌴 #ViceCityNights #BawsaqGains");
    Clip3.SoundTrackTitle = TEXT("Emotion 98.3 - Synthetic Love");
    Clip3.ViewCount = 1150000;
    Clip3.LikeCount = 289000;
    Clip3.CommentCount = 5600;
    Clip3.TopComments.Add(TEXT("@crypto_kingpin: Bought with BAWSAQ BitBull profits 🚀"));
    Clip3.TopComments.Add(TEXT("@swamp_rat: Meanwhile we're boarding up plywood windows in Ambrosia."));
    Clip3.VideoAssetURL = TEXT("/Game/Cinematics/Clips/YachtParty.mp4");
    CachedFeed.Add(Clip3);
}

void UViralClipFeedSubsystem::FetchFeedBatch(int32 Count)
{
    OnFeedRefreshed.Broadcast(CachedFeed);
}

void UViralClipFeedSubsystem::RecordPlayerStuntOrCrimeEvent(const FString& EventType, const FString& LocationName, int32 NotorietyScore)
{
    FViralClipPost NewPost;
    NewPost.PostID = FString::Printf(TEXT("CLIP_USR_%d"), FMath::RandRange(1000, 9999));
    NewPost.CreatorHandle = TEXT("@EyefindLiveWatcher");
    NewPost.Caption = FString::Printf(TEXT("BREAKING: Insane %s witnessed at %s! Leonida is unreal! #Viral #ViceNews"), *EventType, *LocationName);
    NewPost.SoundTrackTitle = TEXT("Flash FM - Hot Pursuit Beat");
    NewPost.ViewCount = static_cast<int64>(NotorietyScore) * 125000;
    NewPost.LikeCount = static_cast<int32>(NotorietyScore * 32000);
    NewPost.CommentCount = static_cast<int32>(NotorietyScore * 890);
    NewPost.TopComments.Add(TEXT("@eyefind_bot: 100% real no CGI!"));
    NewPost.TopComments.Add(TEXT("@leonida_sheriff: Under investigation by Port Gellhorn PD."));
    NewPost.bInvolvesProtagonists = true;

    CachedFeed.Insert(NewPost, 0);
    OnFeedRefreshed.Broadcast(CachedFeed);
    OnPlayerClipWentViral.Broadcast(NewPost.PostID, NewPost.ViewCount);

    UE_LOG(LogTemp, Log, TEXT("[LeonidaReelz] Player action spawned viral clip %s with %lld views!"), *NewPost.PostID, NewPost.ViewCount);
}

void UViralClipFeedSubsystem::LikePost(const FString& PostID)
{
    for (FViralClipPost& Post : CachedFeed)
    {
        if (Post.PostID == PostID)
        {
            Post.LikeCount += 1;
            OnFeedRefreshed.Broadcast(CachedFeed);
            UE_LOG(LogTemp, Log, TEXT("[LeonidaReelz] Liked post %s (Total: %d)"), *PostID, Post.LikeCount);
            break;
        }
    }
}
