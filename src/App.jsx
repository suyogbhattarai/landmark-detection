import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import PoseDetection from './PoseDetection/PoseDetection'
import VideoMask from './Mask/VideoMask'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
  <PoseDetection/>
  {/* toggle the comment on this line to see the video mask using tensorflow js */}
  {/* <VideoMask />  */}
    </>
  )
}

export default App
