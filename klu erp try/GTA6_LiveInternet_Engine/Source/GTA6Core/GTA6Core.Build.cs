// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

using UnrealBuildTool;

public class GTA6Core : ModuleRules
{
    public GTA6Core(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[] {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "EnhancedInput",
            "HTTP",
            "Json",
            "JsonUtilities",
            "ChaosVehicles",
            "PhysicsCore",
            "AIModule",
            "NavigationSystem",
            "GameplayTasks",
            "Slate",
            "SlateCore",
            "UMG",
            "WebBrowser",
            "WebBrowserWidget"
        });

        PrivateDependencyModuleNames.AddRange(new string[] {
            "CinematicCamera",
            "RenderCore",
            "RHI",
            "DeveloperSettings"
        });
    }
}
