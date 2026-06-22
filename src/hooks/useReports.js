import { useEffect, useState } from 'react'

const useReports = (loader, params = {}) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const serializedParams = JSON.stringify(params)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    loader(params)
      .then((response) => active && setData(response.data))
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'Unable to load report.')
        setData(null)
      })
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [loader, serializedParams])

  return { data, isLoading, error }
}

export default useReports
