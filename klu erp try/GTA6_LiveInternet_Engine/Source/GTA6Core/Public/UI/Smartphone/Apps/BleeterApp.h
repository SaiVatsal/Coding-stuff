// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UI/Smartphone/PhoneAppBase.h"
#include "Social/ViralClipFeedSubsystem.h"
#include "UBleeterApp.generated.h"

UENUM(BlueprintType)
enum class EBleeterFeedTab : uint8
{
    ForYou          UMETA(DisplayName = "For You (Leonida Viral)"),
    Following       UMETA(DisplayName = "Following"),
    TrendingCrime   UMETA(DisplayName = "Trending & Vice PD Scanners"),
    MyProfile       UMETA(DisplayName = "My Profile & Clips")
};

USTRUCT(BlueprintType)
struct FBleeterComment
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bleeter")
    FString AuthorHandle;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bleeter")
    FString CommentText;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bleeter")
    int32 Upvotes = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bleeter")
    bool bVerified = false;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBleeterFeedUpdated, const TArray<FViralClipPost>&, Feed);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnBleeterPostLiked, const FString&, PostID, int32, NewLikeCount);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnBleeterNewPostPublished, const FString&, PostID, const FString&, Caption, bool, bWentViral);

/**
 * AAA Bleeter & Leonida Reelz Social App for the Smartphone.
 * Integrates directly with UViralClipFeedSubsystem to show vertical short-form
 * satire video clips, player-generated crime notoriety reels, trending hashtags, and live comments.
 */
UCLASS()
class GTA6CORE_API UBleeterApp : public UPhoneAppBase
{
    GENERATED_BODY()

public:
    UBleeterApp(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;
    virtual void NativeDestruct() override;

    // App Lifecycle Overrides
    virtual void NativeOnAppLaunched(const FString& LaunchParams) override;
    virtual void NativeOnAppResumed() override;
    virtual void NativeOnAppSuspended() override;

    // Feed Navigation & Interaction
    UFUNCTION(BlueprintCallable, Category = "Bleeter Feed")
    void RefreshFeed();

    UFUNCTION(BlueprintCallable, Category = "Bleeter Feed")
    void SwitchFeedTab(EBleeterFeedTab NewTab);

    UFUNCTION(BlueprintCallable, Category = "Bleeter Feed")
    void LikeCurrentPost(const FString& PostID);

    UFUNCTION(BlueprintCallable, Category = "Bleeter Feed")
    void SharePost(const FString& PostID);

    UFUNCTION(BlueprintCallable, Category = "Bleeter Feed")
    void PostBleet(const FString& Caption, const FString& SoundTrack = TEXT("Vice Wave FM"), bool bAttachClip = false);

    UFUNCTION(BlueprintCallable, Category = "Bleeter Feed")
    void NextClip();

    UFUNCTION(BlueprintCallable, Category = "Bleeter Feed")
    void PreviousClip();

    UFUNCTION(BlueprintPure, Category = "Bleeter Feed")
    TArray<FViralClipPost> GetActiveFeed() const;

    UFUNCTION(BlueprintPure, Category = "Bleeter Feed")
    bool GetCurrentActivePost(FViralClipPost& OutPost) const;

    UFUNCTION(BlueprintPure, Category = "Bleeter Profile")
    int32 GetPlayerFollowerCount() const { return PlayerFollowerCount; }

    UFUNCTION(BlueprintPure, Category = "Bleeter Profile")
    int32 GetPlayerNotorietyScore() const { return PlayerNotorietyScore; }

    // Event Dispatchers
    UPROPERTY(BlueprintAssignable, Category = "Bleeter|Events")
    FOnBleeterFeedUpdated OnFeedUpdated;

    UPROPERTY(BlueprintAssignable, Category = "Bleeter|Events")
    FOnBleeterPostLiked OnPostLiked;

    UPROPERTY(BlueprintAssignable, Category = "Bleeter|Events")
    FOnBleeterNewPostPublished OnNewPostPublished;

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bleeter|State")
    EBleeterFeedTab CurrentTab = EBleeterFeedTab::ForYou;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bleeter|State")
    int32 CurrentClipIndex = 0;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bleeter|State")
    TArray<FViralClipPost> CachedFeedList;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Bleeter|State")
    TSet<FString> LikedPostIDs;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bleeter|Profile")
    FString PlayerHandle = TEXT("@Lucia_And_Jason_Official");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bleeter|Profile")
    int32 PlayerFollowerCount = 245000;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bleeter|Profile")
    int32 PlayerNotorietyScore = 88;

private:
    UFUNCTION()
    void HandleSubsystemFeedRefreshed(const TArray<FViralClipPost>& NewFeed);

    UFUNCTION()
    void HandleSubsystemPlayerClipWentViral(const FString& PostID, int64 InitialViews);
};
