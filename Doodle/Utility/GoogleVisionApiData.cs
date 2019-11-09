using System;
using System.IO;
using System.Text.RegularExpressions;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Vision.V1;
using Grpc.Auth;
using Newtonsoft.Json;


namespace Doodle.Utility
{
    public class GoogleVisionApiData
    {

        public static float GetImageData(string Term, string ImagePath)
        {
            string directory = Path.GetFullPath(AppDomain.CurrentDomain.BaseDirectory);
            string jsonPath = directory + "\\Utility\\my-project-90986-379273cc3cd3.json";

            // credential = GoogleCredential.FromFile(jsonPath);
            var credential = GoogleCredential.FromFile(jsonPath)
                .CreateScoped(ImageAnnotatorClient.DefaultScopes);
            var channel = new Grpc.Core.Channel(
                ImageAnnotatorClient.DefaultEndpoint.ToString(),
                credential.ToChannelCredentials());

            var client = ImageAnnotatorClient.Create(channel
                );
            var image = Image.FromFile(ImagePath);

            var response = client.DetectLocalizedObjects(image);
            foreach (var annotation in response)
            {
                if (annotation.Name != null)
                {
                    if (annotation.Name.ToLower() == Term.ToLower())
                    {
                        return annotation.Score;
                    }
                }
            }

            var response2 = client.DetectLabels(image);
            foreach (var annotation in response2)
            {
                if (annotation.Description != null)
                {
                    if (annotation.Description.ToLower() == Term.ToLower())
                    {
                        return annotation.Score;
                    }
                }
            }

            var response3 = client.DetectWebInformation(image);
            foreach (var annotation in response3.WebEntities)
            {
                if (annotation.Description != null)
                {
                    if (annotation.Description.ToLower() == Term.ToLower())
                    {
                        return annotation.Score;
                    }
                }
            }

            return 0.0f;
        }
    }
}