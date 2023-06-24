const express = require('express')
const app = express()
const axios = require('axios')


const NEW_API_BASE = 'http://127.0.0.1:5000/api/v1'

let pendingRequestCount = 0;
let lastRequestId = 0;

function delay(ms){
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve();
    }, ms)
  })
}

app.use(express.json())

app.post('/generate', async (req, res) => {
  const oldData = req.body
  const newData = {
    prompt: oldData.inputs,
    max_new_tokens: oldData.parameters.max_new_tokens,
    do_sample: oldData.parameters.do_sample,
    temperature: oldData.parameters.temperature,
    top_p: oldData.parameters.top_p,
    typical_p: 1,
    repetition_penalty: 1.18,
    top_k: 4,
    min_length: 0,
    no_repeat_ngram_size: 0,
    num_beams: 1,
    penalty_alpha: 0,
    length_penalty: 1,
    early_stopping: false,
    seed: -1,
    add_bos_token: false,
    truncation_length: 2048,
    ban_eos_token: false,
    skip_special_tokens: false,
    stopping_strings: []
  }

  try {
    const requestId = ++lastRequestId;
    const requestIdStr = "<" + String(requestId) + "> ";
    if (pendingRequestCount > 0) {
      let response = await axios.post(NEW_API_BASE + "/stop-stream", {});
      if (response.data.results === "success") {
        console.log(requestIdStr + "Last request stopped successfully.");
      } else {
        console.warn(requestIdStr + `Failed to stop stream ${JSON.stringify(response)}`)
      }
      await delay(150); 
      response = await axios.post(NEW_API_BASE + "/stop-stream", {}); // Workaround for the imperfect implemention in server
      if (response.data.results === "success") {
        console.log(requestIdStr + "Last request stopped successfully_2.");
      } else {
        console.warn(requestIdStr + `Failed to stop stream ${JSON.stringify(response)}`)
      }
    }
    pendingRequestCount++;
    console.log(requestIdStr + "Running new API")
    const response = await axios.post(NEW_API_BASE + "/generate", newData)
    const result = response.data.results[0].text
    console.log(requestIdStr + "Result: ", result);
    res.json({ generated_text: result });
    pendingRequestCount--;  


  } catch (err) {
    console.error(requestIdStr + "Error: ", err.message)
    res.status(500).send({ error: err.message })
  }
})

app.listen(3000)