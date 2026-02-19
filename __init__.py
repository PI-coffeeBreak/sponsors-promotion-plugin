from .router import router
from .schemas.sponsors_component import SponsorsComponent
from coffeebreak import ComponentRegistry


def REGISTER():
    ComponentRegistry.register_component(SponsorsComponent)


def UNREGISTER():
    ComponentRegistry.unregister_component("SponsorsComponent")
