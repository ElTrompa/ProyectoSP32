# Scripts de Configuración para Power BI

Sigue estos pasos para importar tus datos automáticamente con la estructura correcta.

## Paso 1: Abrir el Editor de Consultas
1. Abre Power BI Desktop.
2. En la pestaña **Inicio**, haz clic en **Transformar datos** (icono con una tabla y un lápiz).

---

## Paso 2: Crear la Tabla "Hechos_Logs" (Datos Crudos)
Esta tabla contendrá todo el historial de fichajes.

1. En el editor de Power Query, haz clic derecho en el panel izquierdo (Consultas) -> **Nueva Consulta** -> **Consulta en blanco**.
2. Arriba, haz clic en **"Editor Avanzado"**.
3. **Borra todo** lo que haya y pega este código:

```powerquery
let
    Origen = Json.Document(Web.Contents("http://10.73.45.62:8080/api/datos")),
    presencia = Origen[presencia],
    #"Convertido a tabla" = Table.FromList(presencia, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Se expandió Column1" = Table.ExpandRecordColumn(#"Convertido a tabla", "Column1", {"usuario", "fechaHora", "tipo", "accesoPermitido", "metodoAuth"}, {"Usuario", "FechaHoraOriginal", "Tipo", "AccesoPermitido", "Metodo"}),
    #"Tipo cambiado" = Table.TransformColumnTypes(#"Se expandió Column1",{{"FechaHoraOriginal", type datetime}, {"AccesoPermitido", type logical}, {"Usuario", type text}, {"Tipo", type text}}),
    #"Fecha insertada" = Table.AddColumn(#"Tipo cambiado", "Fecha", each DateTime.Date([FechaHoraOriginal]), type date),
    #"Hora insertada" = Table.AddColumn(#"Fecha insertada", "Hora", each DateTime.Time([FechaHoraOriginal]), type time),
    #"Columnas reordenadas" = Table.ReorderColumns(#"Hora insertada",{"Usuario", "Fecha", "Hora", "Tipo", "AccesoPermitido", "Metodo", "FechaHoraOriginal"})
in
    #"Columnas reordenadas"
```

4. Pulsa **Hecho**.
5. Cambia el nombre de la consulta (a la derecha) a: `Hechos_Logs`.

---

## Paso 3: Crear la Tabla "Dim_Usuarios" (Lista de Trabajadores)
Esta tabla se crea automáticamente extrayendo los usuarios únicos de los logs.

1. Haz clic derecho en el panel izquierdo -> **Nueva Consulta** -> **Consulta en blanco**.
2. Clic en **"Editor Avanzado"**.
3. Borra todo y pega:

```powerquery
let
    Origen = Hechos_Logs,
    #"Otras columnas quitadas" = Table.SelectColumns(Origen,{"Usuario"}),
    #"Duplicados quitados" = Table.Distinct(#"Otras columnas quitadas"),
    #"Filas filtradas" = Table.SelectRows(#"Duplicados quitados", each [Usuario] <> null and [Usuario] <> ""),
    #"Filas ordenadas" = Table.Sort(#"Filas filtradas",{{"Usuario", Order.Ascending}})
in
    #"Filas ordenadas"
```

4. Pulsa **Hecho**.
5. Cambia el nombre a: `Dim_Usuarios`.

---

## Paso 4: Finalizar y Cargar
1. Haz clic en el botón **"Cerrar y aplicar"** (arriba a la izquierda).
2. Power BI descargará los datos.

---

## Paso 5: Crear Tabla Calendario (Opcional pero recomendado)
Ya en la vista principal de Power BI (no en el editor):
1. Ve a la pestaña **Modelado** -> **Nueva tabla**.
2. Pega esta fórmula DAX:

```DAX
Calendario = CALENDARAUTO()
```

¡Listo! Ya tienes tus 3 tablas preparadas para crear los gráficos.
