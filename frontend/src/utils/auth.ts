const TOKEN_KEY = 'car_rental_token'
const USER_KEY = 'car_rental_user'

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getUser = (): any => {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export const setUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY)
}

export const isAdmin = (): boolean => {
  const user = getUser()
  return user?.role_name === 'admin'
}

export const isLoggedIn = (): boolean => {
  return !!getToken()
}

export const logout = (): void => {
  removeToken()
  removeUser()
}
