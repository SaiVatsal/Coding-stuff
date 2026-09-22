// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "PhysicalizedArmoryComponent.generated.h"

UENUM(BlueprintType)
enum class EWeaponSlotType : uint8
{
    PrimaryBack         UMETA(DisplayName = "Primary Long Gun (Back Sling)"),
    SecondaryShoulder   UMETA(DisplayName = "Secondary Heavy / Shotgun (Left Shoulder)"),
    SidearmRightHip     UMETA(DisplayName = "Sidearm Pistol (Right Hip Holster)"),
    SidearmLeftHip      UMETA(DisplayName = "Sidearm / Taser (Left Concealed)"),
    MeleePocket         UMETA(DisplayName = "Melee / Knife Pocket"),
    ThrowablePouch      UMETA(DisplayName = "Grenade / Molotov Pouch")
};

UENUM(BlueprintType)
enum class EDuffleBagTier : uint8
{
    None                UMETA(DisplayName = "No Bag (Maximum Mobility)"),
    SmallGymBag         UMETA(DisplayName = "Small Gym Bag (Moderate Capacity)"),
    HeavyTacticalDuffle UMETA(DisplayName = "Heavy Tactical Duffle (Max Loot / Reduced Agility)")
};

USTRUCT(BlueprintType)
struct FPhysicalWeaponItem
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armory")
    FString ItemID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armory")
    FString DisplayName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armory")
    EWeaponSlotType AssignedSlot = EWeaponSlotType::SidearmRightHip;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armory")
    int32 CurrentAmmo = 30;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armory")
    int32 ReserveAmmo = 120;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armory")
    float WeightKg = 1.2f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Armory")
    bool bIsSilenced = false;
};

USTRUCT(BlueprintType)
struct FProtagonistPhysiologyState
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Physiology")
    float Stamina = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Physiology")
    float MaxStamina = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Physiology")
    float Hydration = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Physiology")
    float BloodAlcoholLevel = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Physiology")
    float AdrenalineBoost = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Physiology")
    float MetabolismRate = 1.0f;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnWeaponEquippedChanged, EWeaponSlotType, Slot, const FPhysicalWeaponItem&, Weapon);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDuffleBagChanged, EDuffleBagTier, BagTier, float, CurrentLootWeight);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnStaminaExhausted, bool, bIsExhausted);

/**
 * AAA Realistic Physicalized Weapon Wheel, Socket Management, Trunk Armory, and Metabolism.
 */
UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class GTA6CORE_API UPhysicalizedArmoryComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UPhysicalizedArmoryComponent();

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    // Weapon Management
    UFUNCTION(BlueprintCallable, Category = "Armory")
    bool EquipWeaponToSlot(const FPhysicalWeaponItem& Weapon, EWeaponSlotType Slot);

    UFUNCTION(BlueprintCallable, Category = "Armory")
    bool DrawWeaponFromSlot(EWeaponSlotType Slot);

    UFUNCTION(BlueprintCallable, Category = "Armory")
    void HolsterCurrentWeapon();

    UFUNCTION(BlueprintCallable, Category = "Armory")
    bool StashWeaponInVehicleTrunk(const FString& ItemID, class ACrimeVehiclePawn* Vehicle);

    UFUNCTION(BlueprintCallable, Category = "Armory")
    bool RetrieveWeaponFromVehicleTrunk(const FString& ItemID, class ACrimeVehiclePawn* Vehicle);

    // Duffle Bag & Loot
    UFUNCTION(BlueprintCallable, Category = "Loot")
    void SetDuffleBagTier(EDuffleBagTier NewTier);

    UFUNCTION(BlueprintCallable, Category = "Loot")
    void AddLootCash(int32 Amount);

    UFUNCTION(BlueprintCallable, Category = "Loot")
    float GetAgilityMultiplier() const;

    // Physiology & Metabolism
    UFUNCTION(BlueprintCallable, Category = "Physiology")
    void ConsumeItem(const FString& ItemType, float HydrationRestore, float AdrenalineDuration);

    UFUNCTION(BlueprintCallable, Category = "Physiology")
    void DrainStamina(float Amount);

    // Getters
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Armory")
    TMap<EWeaponSlotType, FPhysicalWeaponItem> SlottedWeapons;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Armory")
    EWeaponSlotType ActiveDrawnSlot = EWeaponSlotType::SidearmRightHip;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Armory")
    bool bHasWeaponDrawn = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Loot")
    EDuffleBagTier CurrentDuffleBag = EDuffleBagTier::None;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Loot")
    int32 CarriedLootCash = 0;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Loot")
    float CarriedWeightKg = 0.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Physiology")
    FProtagonistPhysiologyState Physiology;

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Armory|Events")
    FOnWeaponEquippedChanged OnWeaponEquippedChanged;

    UPROPERTY(BlueprintAssignable, Category = "Loot|Events")
    FOnDuffleBagChanged OnDuffleBagChanged;

    UPROPERTY(BlueprintAssignable, Category = "Physiology|Events")
    FOnStaminaExhausted OnStaminaExhausted;

private:
    void RecalculateTotalWeight();
    void UpdatePhysiologyTick(float DeltaTime);
};
