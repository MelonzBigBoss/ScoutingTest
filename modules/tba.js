const callAPI = async (route) => {
    // https://www.thebluealliance.com/apidocs/v3 API DOCS
    return await (
      await fetch("https://www.thebluealliance.com/api/v3" + route, {
        method: "GET",
        withCredentials: true,
        headers: {
          "X-TBA-Auth-Key": process.env.tbaKey,
        },
      }).then(response => {
        if (!response.ok) {
          console.log("TBA failed")
        }
        return response
      })
    ).json();
  };

module.exports =  { callAPI }