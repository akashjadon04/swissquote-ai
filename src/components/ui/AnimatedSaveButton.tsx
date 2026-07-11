'use client';

import React from 'react';

export function AnimatedSaveButton({ onClick, 'aria-label': ariaLabel = 'save' }: { onClick?: () => void; 'aria-label'?: string }) {
  return (
    <button className="action_has has_saved" aria-label={ariaLabel} type="button" onClick={onClick} title="Enregistrer le devis">
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
        fill="none"
      >
        <path
          d="m19,21H5c-1.1,0-2-.9-2-2V5c0-1.1.9-2,2-2h11l5,5v11c0,1.1-.9,2-2,2Z"
          strokeLinejoin="round"
          strokeLinecap="round"
          data-path="box"
        ></path>
        <path
          d="M7 3L7 8L15 8"
          strokeLinejoin="round"
          strokeLinecap="round"
          data-path="line-top"
        ></path>
        <path
          d="M17 20L17 13L7 13L7 20"
          strokeLinejoin="round"
          strokeLinecap="round"
          data-path="line-bottom"
        ></path>
      </svg>
    </button>
  );
}
