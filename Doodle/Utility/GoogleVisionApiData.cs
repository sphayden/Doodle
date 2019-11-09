using System;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Vision.V1;
using Grpc.Auth;
using Newtonsoft.Json;


namespace Doodle.Utility
{
    public class GoogleVisionApiData
    {

        public float GetImageData(string Term, string ImagePath)
        {
            string jsonPath = "my-project-90986-379273cc3cd3.json";
            // credential = GoogleCredential.FromFile(jsonPath);
            var credential = GoogleCredential.FromFile(jsonPath)
        .CreateScoped(ImageAnnotatorClient.DefaultScopes);
            var channel = new Grpc.Core.Channel(
                ImageAnnotatorClient.DefaultEndpoint.ToString(),
                credential.ToChannelCredentials());

            var client = ImageAnnotatorClient.Create(channel
                );
            var image = Image.FromFile(ImagePath);
            var response = client.DetectLabels(image);
            //Console.WriteLine(response);
            foreach (var annotation in response)
            {
                if (annotation.Description != null)
                {
                    if(annotation.Description == Term)
                    {
                        return annotation.Score;
                    }
                }
            }
            return 0.0f;
        }

    }

}