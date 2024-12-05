import Cookies from "universal-cookie";
const API_URL = process.env.NEXT_PUBLIC_API_URL
const GOOGLE_OAUTH_API_URL=process.env.NEXT_PUBLIC_GOOGLE_OAUTH_API_URL
export const buildQuery = (obj) => {
    return new URLSearchParams(obj).toString();
}

function updateAccessToken(res) {
    const authToken = res.headers.get("auth-token");
    const cookies = new Cookies(null, { path: '/' })
    if (authToken) cookies.set('access_token', authToken)
    return
}
export const updateTeamMemberPermissions = async (body, cookies) => {
    try {
        const apiResponse = await fetch(`${API_URL}/auth/api/team/update-team-member-permissions`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + cookies.get('access_token'),
            },
            body: JSON.stringify(body)
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData;
    } catch (err) {
        console.error('Err in updateTeamMemberPermissions', err)
        return { data: null, success: false, message: 'Something went wrong in updating Permissions' }
    }

}

export const updateTeamMemberRole = async (body, cookies) => {
    try {
        const apiResponse = await fetch(`${API_URL}/auth/api/team/update-team-member-role`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + cookies.get('access_token'),
            },
            body: JSON.stringify(body)
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData;
    } catch (err) {
        console.error('Err in updateTeamMemberRole', err)
        return { data: null, success: false, message: 'Something went wrong in updating Roles' }
    }

}

export const getAdminCallsApi = async (endpoint, access_token, refresh_token) => {
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'cookies': refresh_token || '',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData;
    } catch (err) {
        console.error('Err in getAdminCallsApi', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const getTransactionsApi = async (endpoint, access_token, refresh_token) => {
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'cookies': refresh_token || '',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData;
    } catch (err) {
        console.error('Err in getTransactionsApi', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const getNormalUsers = async (endpoint, access_token, refresh_token) => {
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'cookies': refresh_token || '',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData;
    } catch (err) {
        console.error('Err in getAllUsers', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}


export const userOnboardingApi = async (endpoint, formData,access_token) => {
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
            headers: {
                // 'Content-Type': 'application/json',
                // 'cookies':refresh_token || '',
                'Authorization':'Bearer '+ access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData;
    } catch (err) {
        console.error('Err in justCheck', err)
        return { data: null, success: false, message: 'Internal Server Error'+err }
    }
}

export const getUserProfile = async (endpoint, access_token,refresh_token) => {
    // console.log(access_token,refresh_token)
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in getUserProfile', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }

}


export const getAdminUsers = async (endpoint, access_token, refresh_token) => {
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'cookies': refresh_token || '',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in getAdminUsers', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const googleOauthLogin = async (tokenResponse,endpoint) => {
    // fetching userinfo from google api
    try {
        const userResponse = await fetch(GOOGLE_OAUTH_API_URL, {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userResponse.json()
        const { email, name, sub, hd } = userInfo
        const teamResponse = await fetch(`${API_URL}${endpoint}`,{
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, name, googleId: sub, organisation: hd })
        })
        updateAccessToken(teamResponse)
        const teamData = await teamResponse.json();
        return teamData
    } catch (err) {
        console.error('Err in googleOauthLogin', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const getUserInterests = async (endpoint, access_token) => {
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData;
    } catch (err) {
        console.error('Err in getUserInterests', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const getPartnerAnalytics=async(endpoint,access_token,refresh_token)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'cookies': refresh_token || '',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in getPartnerAnalytics', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}


export const getPartnerCategoryList=async(endpoint,access_token,refresh_token)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        console.log('apiResponse',apiResponse);
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in getPartnerCategoryList', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const updatePartnerCategory=async(endpoint,access_token,body)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            method:'POST',
            credentials: 'include',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        console.log('apiresponse',apiResponse)
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in getPartnerCategoryList', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const getPartnerReviews=async(endpoint,access_token)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in getPartnerReviews', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const getPaymentsList=async(endpoint,access_token,refresh_token)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'cookies': refresh_token || '',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in getPaymentsList', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const updateApproveorDecline=async(endpoint,access_token,body)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            method:'POST',
            credentials: 'include',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in getPartnerCategoryList', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const managePartnerPermissions=async(endpoint,access_token,body)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            method:'POST',
            credentials: 'include',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in managePartnerPermissions', err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const post=async(endpoint,access_token,body)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            method:'POST',
            credentials: 'include',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in '+ endpoint, err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}

export const get=async(endpoint,access_token)=>{
    try {
        const apiResponse = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
        })
        updateAccessToken(apiResponse)
        const apiData = await apiResponse.json();
        return apiData
    } catch (err) {
        console.error('Err in ' + endpoint, err)
        return { data: null, success: false, message: 'Internal Server Error' }
    }
}