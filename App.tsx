'use client';
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { toggleRTL, toggleTheme, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from '@/store/themeConfigSlice';
import Loading from '@/components/layouts/loading';
import { getTranslation } from '@/i18n';
import { addUser } from './store/userSlice';
import Cookies from 'universal-cookie';
import { getUserProfile } from './utils';
import { usePathname, useRouter } from 'next/navigation';
import { AppProgressBar } from 'next-nprogress-bar';
import path from 'path';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const pathName = usePathname();
    const dispatch = useDispatch();
    const { initLocale } = getTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter()
    const cookies = new Cookies(null, { path: '/' })

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
        // locale
        initLocale(themeConfig.locale);

    }, [dispatch, initLocale, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    // useEffect(() => {
    //     const handleVisibilityChange = () => {
    //         if (document.visibilityState === "visible") {
    //             // Check if the user is authenticated
    //             checkAuthentication();
    //         }
    //     };

    //     // Listen for the visibility change event
    //     document.addEventListener("visibilitychange", handleVisibilityChange);

    //     // Cleanup the event listener on component unmount
    //     return () => {
    //         document.removeEventListener("visibilitychange", handleVisibilityChange);
    //     };
    // }, []);

    async function checkAuthentication() {
        // fetch user
        setIsLoading(true);
        try {
            const apiData = await getUserProfile('/auth/api/team/get-team-profile', cookies.get('access_token'), cookies.get('token'))
            if (apiData.success) {
                dispatch(addUser(apiData.data))
                if(apiData.data.role == ''){
                    router.replace('/pages/error401');
                }
            } else {
                dispatch(addUser(null));
                cookies.remove('access_token');
                cookies.remove('token');
                router.replace('/auth/login');
            }

        }
        catch (err) {
            dispatch(addUser(null));
            cookies.remove('access_token');
            cookies.remove('token');
            router.replace('/auth/login');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        checkAuthentication();
    }, [pathName]);
    return (
        <div
            className={`${(themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
                } main-section relative font-nunito text-sm font-normal antialiased`}
        >
            {isLoading ? <Loading /> : children}
            <AppProgressBar
                height="4px"
                color="#4287f5"
                options={{ showSpinner: false }}
                shallowRouting={false}
            />
        </div>
    );
}

export default App;
