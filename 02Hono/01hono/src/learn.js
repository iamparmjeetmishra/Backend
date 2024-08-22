import { Hono } from "hono";
import { v4 as uuidv4 } from 'uuid'
import { stream, streamText, streamSSE } from 'hono/streaming'

let videos = []

const app = new Hono()

app.get('/', (c) => {
   return c.text('hi hono1')
})

app.post('/video', async (c) => {
   const { videoName, channelName, duration } = await c.req.json()

   const newVideo = {
      id: uuidv4(),
      videoName,
      channelName,
      duration
   }
   videos.push(newVideo)
   console.log('newvideo:', newVideo)
   console.log('VideoArr:', videos)
   return c.json(newVideo)

})

app.get('/videos', async (c) => {

   if (videos.length == 0) {
      return c.json({ message: 'There is no video' })
   }

   return streamText(c, async (stream) => {
      for (const video of videos) {
         await stream.writeln(JSON.stringify(video))
         // await stream.sleep(1000)
      }
   })

})


// 2nd myWay- Working
// app.get('/videos', async (c) => {
//    return await c.json(videos)
// })


//Read by ID

app.get('/video/:id', (c) => {
   const { id } = c.req.param()
   const video = videos.find((video) => video.id === id)

   if (!video) {
      return c.json({ message: 'Video not found' }, 404)
   }

   return c.json(video)
})


// Update

app.put('/video/:id', async (c) => {
   const { id } = c.req.param()
   const index = videos.findIndex((video) => video.id === id)

   if (index === -1) {
      return c.json({ message: 'Video not found-update.' }, 404)
   }

   const { videoName, channelName, duration } = await c.req.json()

   videos[index] = { ...videos[index], videoName, channelName, duration }

   return c.json(({
      message: 'video found',
      video: videos[index]
   }))
})


// delete
app.delete('/video/:id', async (c) => {
   console.log('hi')
   const { id } = c.req.param();
   console.log('id:', id);

   // Check if id is provided
   if (!id) {
      return c.json({ message: 'ID is required' }, 400);
   }

   // Find the video with the matching ID
   const videoIndex = videos.findIndex(video => video.id === id);

   // If no video found, return a not found message
   if (videoIndex === -1) {
      return c.json({ message: 'Video not found' }, 404);
   }

   // Remove the video from the array
   videos.splice(videoIndex, 1);
   console.log('Video deleted:', id);

   return c.json({ message: 'Video deleted successfully' });
});


// delete all videos

app.delete('/videos', (c) => {
   console.log(videos.length)
   if (videos.length === 0) {
      return c.json({ message: 'There is no video' },400)
   }
   videos = []
   return c.json({ message: 'All videos deleted' })
})


export default app;