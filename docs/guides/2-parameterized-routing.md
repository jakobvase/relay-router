# Parameterized Routing

Let's discuss more about routing in Yarr. 

# How Yarr works

Yarr takes an array of route objects as configuration. It offers a simple API to easily declare 
- the component to preload for the route
- the data to preload for the route

Note: The preloading aspect of routing has been covered in detail [here](/docs/advanced/performance-and-ux.md).

# Parameterized routing

To check out how parameterized and nested routes work, check out this example.

- Parameterized routes can take variables in the route like so `/team/:username` and can pass down the value of the variable to the underlying components.

Checkout the example below!


[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/react-eqqxfn?file=src/App.js)
