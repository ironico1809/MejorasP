
"""
class ControlSanitarioSerializer(serializers.ModelSerializer):
    insumo_nombre = serializers.ReadOnlyField(source='insumo.nombre')
    insumo_tipo = serializers.ReadOnlyField(source='insumo.tipo')
    insumo_unidad = serializers.ReadOnlyField(source='insumo.unidad_medida')

    class Meta:
        model = ControlSanitario
        fields = '__all__'

"""
from rest_framework import serializers

from apps.insumos.models import ControlSanitario
from apps.sanitario.models import RegistroEnfermedadLote, AlertaSanitaria


class ControlSanitarioSerializer(serializers.ModelSerializer):
    """
    Serializer existente para tratamientos sanitarios.

    Este serializer pertenece al CU16:
    Registrar tratamientos aplicados.
    """

    insumo_nombre = serializers.ReadOnlyField(source='insumo.nombre')
    insumo_tipo = serializers.ReadOnlyField(source='insumo.tipo')
    insumo_unidad = serializers.ReadOnlyField(source='insumo.unidad_medida')

    class Meta:
        model = ControlSanitario
        fields = '__all__'


class RegistroEnfermedadLoteSerializer(serializers.ModelSerializer):
    """
    Serializer para registrar enfermedades por lote.

    Sirve como entrada para que el CU17 pueda evaluar
    si corresponde generar una alerta sanitaria.
    """

    galpon_nombre = serializers.ReadOnlyField(source='lote.galpon.nombre')
    cantidad_actual_lote = serializers.ReadOnlyField(source='lote.cantidad_actual')

    class Meta:
        model = RegistroEnfermedadLote
        fields = [
            'id',
            'lote',
            'galpon_nombre',
            'cantidad_actual_lote',
            'nombre_enfermedad',
            'aves_afectadas',
            'descripcion',
            'estado',
            'fecha_registro',
            'empresa',
        ]
        read_only_fields = [
            'id',
            'galpon_nombre',
            'cantidad_actual_lote',
            'fecha_registro',
            'empresa',
        ]

    def validate(self, data):
        """
        Validamos que la cantidad de aves afectadas sea coherente.

        No puede ser 0.
        No puede ser mayor a la cantidad actual del lote.
        """

        lote = data.get('lote')
        aves_afectadas = data.get('aves_afectadas')

        if aves_afectadas is not None and aves_afectadas <= 0:
            raise serializers.ValidationError({
                'aves_afectadas': 'La cantidad de aves afectadas debe ser mayor a 0.'
            })

        if lote and aves_afectadas is not None:
            if aves_afectadas > lote.cantidad_actual:
                raise serializers.ValidationError({
                    'aves_afectadas': 'Las aves afectadas no pueden superar la cantidad actual del lote.'
                })

        return data


class AlertaSanitariaSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar las alertas sanitarias al frontend.
    """

    lote_codigo = serializers.SerializerMethodField()
    galpon_nombre = serializers.SerializerMethodField()
    insumo_nombre = serializers.ReadOnlyField(source='insumo.nombre')

    class Meta:
        model = AlertaSanitaria
        fields = [
            'id',
            'lote',
            'lote_codigo',
            'galpon_nombre',
            'registro_enfermedad',
            'insumo',
            'insumo_nombre',
            'tipo_alerta',
            'nivel',
            'titulo',
            'descripcion',
            'causa',
            'cantidad_afectada',
            'porcentaje_afectado',
            'valor_detectado',
            'umbral',
            'estado',
            'fecha_hora',
            'atendida_por',
            'fecha_atencion',
            'empresa',
        ]
        read_only_fields = [
            'id',
            'lote_codigo',
            'galpon_nombre',
            'fecha_hora',
            'atendida_por',
            'fecha_atencion',
            'empresa',
        ]

    def get_lote_codigo(self, obj):
        if obj.lote:
            return f"Lote {obj.lote.id_lote}"
        return None

    def get_galpon_nombre(self, obj):
        if obj.lote and obj.lote.galpon:
            return obj.lote.galpon.nombre
        return None
