let int: ReturnType<Window['setInterval']>

export const waitFor = async (callback: () => boolean, interval = 100) =>
  await new Promise((resolve) => {
    if (callback()) resolve(true)
    clearInterval(int)
    int = setInterval(() => {
      if (!callback()) return
      clearInterval(int)
      resolve(true)
    }, interval) as unknown as number
  })
