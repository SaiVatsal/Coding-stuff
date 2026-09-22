// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "ViralClipFeedSubsystem.generated.h"

USTRUCT(BlueprintType)
struct FViralClipPost
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    FString PostID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    FString CreatorHandle;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    FString Caption;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    FString SoundTrackTitle;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    int64 ViewCount = 142000;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    int32 LikeCount = 38400;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    int32 CommentCount = 1290;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    TArray<FString> TopComments;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    FString VideoAssetURL;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Social Feed")
    bool bInvolvesProtagonists = false;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnViralFeedRefreshed, const TArray<FViralClipPost>&, NewFeed);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnPlayerClipWentViral, const FString&, PostID, int64, InitialViews);

/**
 * AAA In-Game Vertical Short-Form Video Feed Subsystem (Leonida Reelz / Bleeter Clips).
 */
UCLASS()
class GTA6CORE_API UViralClipFeedSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    UFUNCTION(BlueprintCallable, Category = "Social Media")
    void FetchFeedBatch(int32 Count = 10);

    UFUNCTION(BlueprintCallable, Category = "Social Media")
    void RecordPlayerStuntOrCrimeEvent(const FString& EventType, const FString& LocationName, int32 NotorietyScore);

    UFUNCTION(BlueprintCallable, Category = "Social Media")
    void LikePost(const FString& PostID);

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Social Media")
    TArray<FViralClipPost> CachedFeed;

    UPROPERTY(BlueprintAssignable, Category = "Social Media|Events")
    FOnViralFeedRefreshed OnFeedRefreshed;

    UPROPERTY(BlueprintAssignable, Category = "Social Media|Events")
    FOnPlayerClipWentViral OnPlayerClipWentViral;

private:
    void SeedInitialViralClips();
};
