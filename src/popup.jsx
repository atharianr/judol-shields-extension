import React from "react";
import { createRoot } from "react-dom/client";
import './style.css';
import ToggleButton from "./components/ToggleButton.jsx";

function Popup() {
    return (
        <div className="font-poppins flex flex-col w-96 pt-11 pb-6 px-11 text-[#2F3396]">
            <h1 className="text-2xl font-bold text-center">
                Your future <span className="text-[#6B6FC2]">doesn't</span> need a <span className="text-[#6B6FC2]">roll of the dice</span>.
            </h1>
            <p className="text-center mt-8">You can turn on/off the filter by clicking on the button below.</p>
            <ToggleButton className="mt-10" />
            <img src="./assets/JudolShieldsLogoText.svg" alt="Judol Shields Logo" draggable="false" className="h-8 w-fit self-center mt-10" />
        </div>
    )
}

const container = document.getElementById("react-target");
const root = createRoot(container);
root.render(
    <Popup />
);
