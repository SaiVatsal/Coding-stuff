// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "Inventory/PhysicalizedArmoryComponent.h"
#include "Vehicles/CrimeVehiclePawn.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"

UPhysicalizedArmoryComponent::UPhysicalizedArmoryComponent()
{
    PrimaryComponentTick.bCanEverTick = true;

    // Seed starter loadout (Pistol in Right Hip)
    FPhysicalWeaponItem StarterPistol;
    StarterPistol.ItemID = TEXT("WEAPON_COMBAT_PISTOL_9MM");
    StarterPistol.DisplayName = TEXT("Vice City Armory 9mm Service Pistol");
    StarterPistol.AssignedSlot = EWeaponSlotType::SidearmRightHip;
    StarterPistol.CurrentAmmo = 15;
    StarterPistol.ReserveAmmo = 60;
    StarterPistol.WeightKg = 0.95f;
    StarterPistol.bIsSilenced = false;

    SlottedWeapons.Add(EWeaponSlotType::SidearmRightHip, StarterPistol);
}

void UPhysicalizedArmoryComponent::BeginPlay()
{
    Super::BeginPlay();
    RecalculateTotalWeight();
}

void UPhysicalizedArmoryComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    UpdatePhysiologyTick(DeltaTime);
}

bool UPhysicalizedArmoryComponent::EquipWeaponToSlot(const FPhysicalWeaponItem& Weapon, EWeaponSlotType Slot)
{
    FPhysicalWeaponItem NewItem = Weapon;
    NewItem.AssignedSlot = Slot;
    SlottedWeapons.Add(Slot, NewItem);
    RecalculateTotalWeight();

    OnWeaponEquippedChanged.Broadcast(Slot, NewItem);
    UE_LOG(LogTemp, Log, TEXT("[Armory] Slotted %s into %s"), *Weapon.DisplayName, *UEnum::GetValueAsString(Slot));
    return true;
}

bool UPhysicalizedArmoryComponent::DrawWeaponFromSlot(EWeaponSlotType Slot)
{
    if (!SlottedWeapons.Contains(Slot))
    {
        UE_LOG(LogTemp, Warning, TEXT("[Armory] Slot is empty: %s"), *UEnum::GetValueAsString(Slot));
        return false;
    }

    ActiveDrawnSlot = Slot;
    bHasWeaponDrawn = true;
    UE_LOG(LogTemp, Log, TEXT("[Armory] Drew weapon: %s"), *SlottedWeapons[Slot].DisplayName);
    return true;
}

void UPhysicalizedArmoryComponent::HolsterCurrentWeapon()
{
    bHasWeaponDrawn = false;
    UE_LOG(LogTemp, Log, TEXT("[Armory] Holstered active weapon."));
}

bool UPhysicalizedArmoryComponent::StashWeaponInVehicleTrunk(const FString& ItemID, ACrimeVehiclePawn* Vehicle)
{
    if (!Vehicle) return false;

    for (auto It = SlottedWeapons.CreateIterator(); It; ++It)
    {
        if (It->Value.ItemID == ItemID)
        {
            FPhysicalWeaponItem Stashed = It->Value;
            It.RemoveCurrent();
            RecalculateTotalWeight();

            Vehicle->TrunkStorage.Add(Stashed);
            UE_LOG(LogTemp, Log, TEXT("[Armory] Stashed %s in vehicle trunk."), *Stashed.DisplayName);
            return true;
        }
    }
    return false;
}

bool UPhysicalizedArmoryComponent::RetrieveWeaponFromVehicleTrunk(const FString& ItemID, ACrimeVehiclePawn* Vehicle)
{
    if (!Vehicle) return false;

    for (int32 i = 0; i < Vehicle->TrunkStorage.Num(); ++i)
    {
        if (Vehicle->TrunkStorage[i].ItemID == ItemID)
        {
            FPhysicalWeaponItem Item = Vehicle->TrunkStorage[i];
            Vehicle->TrunkStorage.RemoveAt(i);
            EquipWeaponToSlot(Item, Item.AssignedSlot);
            UE_LOG(LogTemp, Log, TEXT("[Armory] Retrieved %s from vehicle trunk."), *Item.DisplayName);
            return true;
        }
    }
    return false;
}

void UPhysicalizedArmoryComponent::SetDuffleBagTier(EDuffleBagTier NewTier)
{
    CurrentDuffleBag = NewTier;
    RecalculateTotalWeight();
    OnDuffleBagChanged.Broadcast(CurrentDuffleBag, CarriedWeightKg);
}

void UPhysicalizedArmoryComponent::AddLootCash(int32 Amount)
{
    CarriedLootCash += Amount;
    // Every $100,000 in bills adds ~1kg of physical weight
    RecalculateTotalWeight();
    OnDuffleBagChanged.Broadcast(CurrentDuffleBag, CarriedWeightKg);
}

float UPhysicalizedArmoryComponent::GetAgilityMultiplier() const
{
    float Multiplier = 1.0f;
    if (CurrentDuffleBag == EDuffleBagTier::SmallGymBag) Multiplier = 0.92f;
    else if (CurrentDuffleBag == EDuffleBagTier::HeavyTacticalDuffle) Multiplier = 0.80f;

    // Additional weight penalty for excessive carried loot
    if (CarriedWeightKg > 15.0f)
    {
        Multiplier -= FMath::Clamp((CarriedWeightKg - 15.0f) * 0.015f, 0.0f, 0.35f);
    }
    return Multiplier;
}

void UPhysicalizedArmoryComponent::ConsumeItem(const FString& ItemType, float HydrationRestore, float AdrenalineDuration)
{
    Physiology.Hydration = FMath::Clamp(Physiology.Hydration + HydrationRestore, 0.0f, 100.0f);
    Physiology.AdrenalineBoost = AdrenalineDuration;
    UE_LOG(LogTemp, Log, TEXT("[Physiology] Consumed %s. Hydration: %.1f, Adrenaline: %.1fs"), *ItemType, Physiology.Hydration, AdrenalineDuration);
}

void UPhysicalizedArmoryComponent::DrainStamina(float Amount)
{
    Physiology.Stamina = FMath::Clamp(Physiology.Stamina - Amount, 0.0f, Physiology.MaxStamina);
    if (Physiology.Stamina <= 0.0f)
    {
        OnStaminaExhausted.Broadcast(true);
    }
}

void UPhysicalizedArmoryComponent::RecalculateTotalWeight()
{
    CarriedWeightKg = 0.0f;
    for (const auto& Pair : SlottedWeapons)
    {
        CarriedWeightKg += Pair.Value.WeightKg;
    }
    if (CurrentDuffleBag == EDuffleBagTier::SmallGymBag) CarriedWeightKg += 1.5f;
    else if (CurrentDuffleBag == EDuffleBagTier::HeavyTacticalDuffle) CarriedWeightKg += 4.0f;

    // Preserve physical weight of carried cash ($100k = ~1kg)
    CarriedWeightKg += (static_cast<float>(CarriedLootCash) / 100000.0f);

    // Apply speed adjustment to owning character respecting character movement states
    if (ACharacter* Char = Cast<ACharacter>(GetOwner()))
    {
        if (UCharacterMovementComponent* MoveComp = Char->GetCharacterMovement())
        {
            MoveComp->MaxWalkSpeed = 480.0f * GetAgilityMultiplier();
        }
    }
}

void UPhysicalizedArmoryComponent::UpdatePhysiologyTick(float DeltaTime)
{
    // Adrenaline countdown
    if (Physiology.AdrenalineBoost > 0.0f)
    {
        Physiology.AdrenalineBoost = FMath::Max(0.0f, Physiology.AdrenalineBoost - DeltaTime);
    }

    // Passive stamina regeneration
    if (Physiology.Stamina < Physiology.MaxStamina)
    {
        float RegenRate = (Physiology.AdrenalineBoost > 0.0f) ? 30.0f : 15.0f;
        Physiology.Stamina = FMath::Min(Physiology.MaxStamina, Physiology.Stamina + (RegenRate * DeltaTime));
        if (Physiology.Stamina > 20.0f)
        {
            OnStaminaExhausted.Broadcast(false);
        }
    }

    // Hydration decay
    Physiology.Hydration = FMath::Max(0.0f, Physiology.Hydration - (0.05f * DeltaTime));
}
