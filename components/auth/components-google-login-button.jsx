'use client'

import { addUser } from "@/store/userSlice";
import { googleOauthLogin } from "@/utils";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

function GoogleLoginButton() {
    const dispatch=useDispatch()
    const router=useRouter()
    const googleLogin = useGoogleLogin({
        onSuccess: async tokenResponse => {
            const apiData = await googleOauthLogin(tokenResponse,'/auth/api/team/create-team-user')
            if(apiData.success) {
                // redirect to dashboard
                // window.location.replace('/');
                router.replace('/')
                router.refresh()
                dispatch(addUser(apiData.data))
            }
            else alert(apiData.message)
        },
        onError: error => console.log('Login Failed:', error),
    });

    return (
        <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" onClick={googleLogin}>
            Sign in
        </button>
    );
}

export default GoogleLoginButton;