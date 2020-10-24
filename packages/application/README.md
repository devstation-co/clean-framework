# Application base class

To register new application use cases, use the init function in the constructor.

## How to use:
1. Extends application layer from the base class
2. Initialize use cases
___
## Example:
```javascript
import Base from 'base.application.micromodule';
import useCases from './use-cases';

export default class Application extends {
    constructor(params){
        this.init({
            settings: {
                useCaseName: params[useCaseName]
            },
            usecases: {
                useCases.useCaseName
            }
        })
    }
}
```