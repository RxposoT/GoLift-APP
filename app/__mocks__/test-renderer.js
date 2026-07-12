// React 19's react-test-renderer deprecated createRoot — its create() API takes
// the element upfront and returns { root, update(el), unmount(), toJSON() }.
// @testing-library/react-native v14 expects createRoot(options) → { render(el), unmount(), container }.
// This adapter bridges the two APIs.

const { create: reactCreate } = jest.requireActual("react-test-renderer");

function createRoot(rootOptions) {
  let instance = null;

  const renderer = {
    render(element) {
      if (instance) {
        instance.update(element);
      } else {
        instance = reactCreate(element, rootOptions);
      }
    },
    unmount() {
      if (instance) {
        instance.unmount();
        instance = null;
      }
    },
    get container() {
      return instance ? instance.root : null;
    },
  };

  return renderer;
}

module.exports = { createRoot };
