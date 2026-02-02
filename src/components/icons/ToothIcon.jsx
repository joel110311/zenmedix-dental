
export const ToothIcon = ({ className = "w-6 h-6", fill = "currentColor" }) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M17.5 2.5C15.5 2.5 13.8 3.2 12 4.5C10.2 3.2 8.5 2.5 6.5 2.5C3.2 2.5 1 5 1 9C1 15 5 21.5 5 21.5L8.5 18L12 20.5L15.5 18L19 21.5C19 21.5 23 15 23 9C23 5 20.8 2.5 17.5 2.5Z"
                stroke={fill}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
