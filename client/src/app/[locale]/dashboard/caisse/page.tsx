"use client";
import React from 'react';
import CaisseSystem from './CaisseSystem';

export default function PageCaisse() {
  return (
    <div className="p-4 max-w-[1600px] mx-auto min-h-screen bg-gray-100">
      {/* On intègre le système complet de caisse ici */}
      <CaisseSystem />
    </div>
  );
}