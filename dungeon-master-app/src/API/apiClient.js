import axios from 'axios'

// This creates an apiClient that can be used across all frontend components, which makes it easy to change the url when needed.
const apiClient = axios.create({
    baseURL: '/', //TODO: Change this to my deployed server when swapping to production 
    withCredentials: true
})

// Gets the csrf token from a cookie to prevent csrf attacks.
// This checks the cookie for 'csrf_access_token' and then splits it at the '=', returning what comes after, which would be the token, if it is found.
function getCsrfToken(){
    return document.cookie.split('; ').find(row=>row.startsWith('csrf_access_token='))?.split('=')[1];
}

// This is the function that all endpoints will be called from, instead of directly using axios in all jsx files.
// This function is used instead to ensure that every time a mutating endpoint (POST, PUT, PATCH, DELETE) is being used, the csrf token is being sent along with it.
export async function apiFetch(endpoint, options = {}) {
    const method = options.method?.toLowerCase() || 'get';
    const mutating = ['post', 'put', 'patch', 'delete'].includes(method);

    const response = await apiClient.request({
        url: endpoint,
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(mutating && { 'X-CSRF-TOKEN': getCsrfToken() }),
            ...options.headers,
        },
    });

    return response;
}