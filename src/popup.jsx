import React from "react";
import { createRoot } from "react-dom/client";
import './style.css';
import ToggleButton from "./components/ToggleButton.jsx";

function Popup() {
    return (
        <div
            className="font-poppins flex flex-col w-96 pt-11 pb-6 px-11 text-[#2F3396]"
            style={{
                backgroundImage: "url('/assets/JudolShieldsBackground.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <h1 className="text-2xl font-bold text-center bg-re">
                Kami bantu <span className="text-[#6B6FC2]">kamu</span> tetap di jalur yang <span className="text-[#6B6FC2]">positif</span>.
            </h1>
            <p className="text-center mt-8">Atur filter kapan saja dengan tombol di bawah.</p>
            <ToggleButton className="mt-8" />
            <img src="./assets/JudolShieldsLogoText.svg" alt="Judol Shields Logo" draggable="false" className="h-8 w-fit self-center mt-10" />
        </div>
    )
}

const container = document.getElementById("react-target");
const root = createRoot(container);
root.render(
    <Popup />
);
