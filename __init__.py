from utils.api import Router
from .router import router
from .schemas.sponsors_component import SponsorsComponent
from services.component_registry import ComponentRegistry

def register_plugin():
    ComponentRegistry.register_component(SponsorsComponent)
    print("Sponsors component registered.")
    return router

def unregister_plugin():
    ComponentRegistry.unregister_component("SponsorsComponent")
    print("Sponsors component unregistered.")

REGISTER = register_plugin
UNREGISTER = unregister_plugin