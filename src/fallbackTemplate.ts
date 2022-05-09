import { FallbackTemplateDefinition } from "./types";

// todo: consider moving to w2c-server

// prettier-ignore
export const fallbackTemplate: FallbackTemplateDefinition = {
  "fields": [
    {
      "fieldname": "itemType",
      "required": true,
      "procedures": [
        {
          "selections": [
            {
              "type": "citoid",
              "config": "itemType"
            }
          ],
          "transformations": []
        }
      ]
    },
    {
      "fieldname": "title",
      "required": true,
      "procedures": [
        {
          "selections": [
            {
              "type": "citoid",
              "config": "title" 
            }
          ],
          "transformations": []
        }
      ]
    },
    {
      "fieldname": "authorFirst",
      "required": false,
      "procedures": [
        {
          "selections": [
            {
              "type": "citoid",
              "config": "authorFirst"
            }
          ],
          "transformations": []
        }
      ]
    },
    {
      "fieldname": "authorLast",
      "required": false,
      "procedures": [
        {
          "selections": [
            {
              "type": "citoid",
              "config": "authorLast"
            }
          ],
          "transformations": []
        }
      ]
    },
    {
      "fieldname": "date",
      "required": false,
      "procedures": [
        {
          "selections": [
            {
              "type": "citoid",
              "config": "date"
            }
          ],
          "transformations": [
            {
              "type": "date",
              "config": "en",
              "itemwise": false
            }
          ]
        }
      ]
    },
    {
      "fieldname": "publishedIn",
      "required": false,
      "procedures": [
        {
          "selections": [
            {
              "type": "citoid",
              "config": "publicationTitle"
            },
            {
              "type": "citoid",
              "config": "code"
            },
            {
              "type": "citoid",
              "config": "reporter"
            }
          ],
          "transformations": [
            {
              "type": "range",
              "config": "1",
              "itemwise": false
            }
          ]
        }
      ]
    },
    {
      "fieldname": "publishedBy",
      "required": false,
      "procedures": [
        {
          "selections": [
            {
              "type": "citoid",
              "config": "publisher"
            }
          ],
          "transformations": []
        }
      ]
    },
    {
      "fieldname": "language",
      "required": false,
      "procedures": [
        {
          "selections": [
            {
              "type": "citoid",
              "config": "language"
            }
          ],
          "transformations": []
        }
      ]
    }
  ]
}
