import React, { useState } from "react";

export default function ToggleButton({ className = '' }) {
    const [isActive, setIsActive] = useState(false);

    const handleClick = (event) => {
        chrome.storage.local.get(['featureEnabled'], (result) => {
            const isFeatureEnabled = result.featureEnabled ?? false;
            chrome.storage.local.set({ featureEnabled: !isFeatureEnabled }, () => {
                console.log("Set featureEnabled -> ", !isFeatureEnabled);
                setIsActive(!isFeatureEnabled)
                refreshPage(event)
            });
        })

    }

    const refreshPage = (event) => {
        event.preventDefault();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.reload(tabs[0].id);
        });
    }

    const getFeatureEnabled = () => {
        chrome.storage.local.get(['featureEnabled'], (result) => {
            const isFeatureEnabled = result.featureEnabled ?? false;
            setIsActive(isFeatureEnabled)
        })
    }

    getFeatureEnabled()

    return (
        <div
            className={`${className} flex flex-col aspect-square ${isActive ? "bg-[#2F3396] shadow-[0_0_16px_0_rgba(47,51,150,1)]" : "bg-white hover:bg-gray-200 shadow-[0_0_16px_0_rgba(0,0,0,0.25)]"} rounded-full self-center items-center p-6 cursor-pointer  group duration-500`}
            onClick={handleClick}
        >
            <img
                src={isActive ? './assets/JudolShieldsLogoWhite.svg' : './assets/JudolShieldsLogoGray.svg'}
                alt="Judol Shields Logo"
                draggable="false"
                className="h-16 w-fit select-none pointer-events-none"
            />
            <p className={`mt-2 font-bold ${isActive ? "text-white" : "text-[#A0A0A0]"} select-none`}>{isActive ? "ON" : "OFF"}</p>
        </div>
    )
}