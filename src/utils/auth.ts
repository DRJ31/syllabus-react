import Base64 from 'base-64'

interface SessionData {
  time: number
  token: string
}

export class UserInfo {
  setUserInfo(token: string): void {
    const data: SessionData = {
      time: new Date().getTime(),
      token,
    }
    window.localStorage.setItem('userEncrypted', Base64.encode(JSON.stringify(data)))
  }

  getUserInfo(): SessionData | null | -1 {
    const userData = window.localStorage.getItem('userEncrypted')
    if (!userData) return null

    const obj: SessionData = JSON.parse(Base64.decode(userData))

    // Session expires after 30 minutes, or if time is in the future (clock skew)
    if (new Date().getTime() - obj.time > 1800000 || new Date().getTime() < obj.time) {
      window.localStorage.removeItem('userEncrypted')
      return -1
    }

    obj.time = new Date().getTime()
    window.localStorage.setItem('userEncrypted', Base64.encode(JSON.stringify(obj)))
    return obj
  }

  checkFavorite(favArr: Array<{ id: number }>, id: number): boolean {
    return favArr.some(fav => fav.id === id)
  }
}
