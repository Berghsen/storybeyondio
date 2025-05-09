import { useAuthContext } from './useAuthContext'
import { useItemsContext } from './useItemsContext'

export const useLogout = () => {
  const { dispatch } = useAuthContext()
  const { dispatch: dispatchItems } = useItemsContext()

  const logout = () => {
    // remove user from storage
    localStorage.removeItem('user')

    // dispatch logout action
    dispatch({ type: 'LOGOUT' })
    dispatchItems({ type: 'SET_ITEMS', payload: null })
  }

  return { logout }
}