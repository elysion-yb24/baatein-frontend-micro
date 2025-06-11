import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
    title: 'Error 401',
};

const Error401 = () => {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            <div className="px-6 py-16 text-center font-semibold before:container before:absolute before:left-1/2 before:aspect-square before:-translate-x-1/2 before:rounded-full before:bg-[linear-gradient(180deg,#4361EE_0%,rgba(67,97,238,0)_50.73%)] before:opacity-10 md:py-20">
                <div className="relative">
                    <img src="/assets/images/error/401-light.png" alt="404" className="dark-img mx-auto -mt-10 w-full max-w-xs object-cover md:-mt-14 md:max-w-xl" />
                    <img src="/assets/images/error/401-light.png" alt="404" className="light-img mx-auto -mt-10 w-full max-w-xs object-cover md:-mt-14 md:max-w-xl" />
                    <p className="mt-5 text-base dark:text-white">Contact Admin For Access.</p>
                </div>
            </div>
        </div>
    );
};

export default Error401;
