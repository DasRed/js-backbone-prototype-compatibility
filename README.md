# backbone-prototype-compatibility

## Why this?
Backbone uses the extend function to create models, collections, views. But this function use internally a surrogate, which does not allow the native using of JS Prototypes. 
With this surrogate, you can not determine an backbone object of a specific instance (the instanceof test will always failed).

This function allows your own prototypes to interact correctly with backbone by using the backbone prototypes model, collection, views.

## Install
```
bower install backbone-prototype-compatibility --save
bower install backbone-prototype-compatibility --save
```

## Usage
**es5**
```js
function MyModel(attributes, options) {
    Backbone.Model.apply(this, arguments);
}

MyModel.prototype = Object.create(Backbone.Model, {
    property: {
        value: 10,
        enumerable: true,
        configurable: true,
        writable: true
    }
});
MyModel = compatibility(MyModel);
```

**es6**
```js
class MyModel extends Backbone.Model {
    constructor(attributes, options) {
        this.property = 10;
        
        super(attributes, options);
    }
}

MyModel = compatibility(MyModel);
```

After the creation of the prototype and using the compatibility function, the prototype will contain the static methods
 - compatibility ... this is the compatibility function from this repository
 - extend        ... this is the original Backbone.extend function, which is present on every Backbone Prototype.
